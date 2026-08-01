/**
 * 本文から張っている外部リンクが、まだ生きているかを調べる。
 *
 *   node scripts/check-links.mjs
 *   node scripts/check-links.mjs --verbose   # 生きているものも並べる
 *
 * 「もっと詳しく」で公式ドキュメントへ送り出している以上、リンク切れは
 * 学習者を行き止まりに連れていくことになる。ドキュメント側の URL は
 * こちらの都合と関係なく変わるので、ときどき回して直す。
 *
 * ネットワークに出るので、コンテンツのテスト（vitest）には入れていない。
 * コースを足したときと、リリース前に手元で回す用。
 */

import { loadCourses } from "./course-runner.mjs";

const verbose = process.argv.includes("--verbose");

/** 本文中の Markdown リンクから、外部 URL だけを拾う。 */
function collectUrls(courses) {
  /** @type {Map<string, string[]>} URL → それを載せているレッスン */
  const urls = new Map();

  for (const course of courses)
    for (const chapter of course.chapters)
      for (const lesson of chapter.lessons)
        for (const [, url] of lesson.body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
          const where = `${course.title} / ${lesson.title}`;
          urls.set(url, [...(urls.get(url) ?? []), where]);
        }

  return urls;
}

/**
 * 1 本叩いて、たどり着けるかを見る。
 * HEAD を拒む配信もあるので GET で取りにいく（本文は捨てる）。
 */
async function check(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "pylabo-link-check" },
      signal: AbortSignal.timeout(20_000),
    });
    const html = res.ok ? await res.text() : "";

    /* #anchor 付きなら、その id が本当にあるかまで見る。
       ページは生きているが節が消えている、という壊れ方がいちばん多い。 */
    const anchor = new URL(url).hash.slice(1);
    if (res.ok && anchor && !html.includes(`id="${anchor}"`)) {
      return { ok: false, reason: `#${anchor} が見つからない` };
    }

    return res.ok ? { ok: true } : { ok: false, reason: `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, reason: error.name === "TimeoutError" ? "時間切れ" : error.message };
  }
}

const { courses } = await loadCourses();
const urls = collectUrls(courses);

console.log(`${urls.size} 本のリンクを確かめます…\n`);

const broken = [];
let done = 0;

/* 相手のサーバーに迷惑をかけない程度に、少しだけ並べて叩く。 */
const entries = [...urls.entries()];
const CONCURRENCY = 6;

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (entries.length > 0) {
      const [url, places] = entries.shift();
      const result = await check(url);
      done += 1;

      if (!result.ok) {
        broken.push({ url, places, reason: result.reason });
        console.log(`  NG  ${url}\n      ${result.reason}`);
      } else if (verbose) {
        console.log(`  ok  ${url}`);
      }
    }
  })
);

console.log(`\n確認 ${done} 本 / 切れ ${broken.length} 本`);

if (broken.length > 0) {
  console.log("\n直す場所:");
  for (const { url, places, reason } of broken) {
    console.log(`\n  ${url}  （${reason}）`);
    for (const place of [...new Set(places)]) console.log(`    - ${place}`);
  }
  process.exit(1);
}
