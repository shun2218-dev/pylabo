import { describe, expect, it } from "vitest";

import { resolveSiteUrl, resolveSiteUrlOrFail } from "../../scripts/site-url.mjs";

/* canonical / og:url / sitemap の絶対 URL がここから作られる。
   間違った URL を出すと検索結果から落ちるため、優先順位と
   「決められないときは null」を固定しておく。 */
describe("resolveSiteUrl", () => {
  it("SITE_URL が最優先", () => {
    expect(
      resolveSiteUrl({
        SITE_URL: "https://a.example",
        VITE_SITE_URL: "https://b.example",
        VERCEL_PROJECT_PRODUCTION_URL: "c.example",
      })
    ).toBe("https://a.example");
  });

  it("VITE_SITE_URL も受け付ける", () => {
    expect(resolveSiteUrl({ VITE_SITE_URL: "https://b.example" })).toBe("https://b.example");
  });

  it("Vercel の本番ドメインには https を補う", () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "c.example" })).toBe(
      "https://c.example"
    );
  });

  it("末尾のスラッシュを落とす", () => {
    expect(resolveSiteUrl({ SITE_URL: "https://a.example///" })).toBe("https://a.example");
  });

  it("サブパスは保つ", () => {
    expect(resolveSiteUrl({ SITE_URL: "https://user.github.io/pylabo/" })).toBe(
      "https://user.github.io/pylabo"
    );
  });

  it("空文字は指定なしとして扱う", () => {
    expect(resolveSiteUrl({ SITE_URL: "   ", VERCEL_PROJECT_PRODUCTION_URL: "c.example" })).toBe(
      "https://c.example"
    );
  });

  it("決められなければ null（既定値を作らない）", () => {
    expect(resolveSiteUrl({})).toBeNull();
  });
});

describe("resolveSiteUrlOrFail", () => {
  it("Vercel の本番ビルドで決められないときは例外にする", () => {
    expect(() => resolveSiteUrlOrFail({ VERCEL: "1", VERCEL_ENV: "production" })).toThrow(
      /Enable access to System Environment Variables/
    );
  });

  it("Vercel の本番でも URL が取れていれば通す", () => {
    expect(
      resolveSiteUrlOrFail({
        VERCEL: "1",
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "pylabo.vercel.app",
      })
    ).toBe("https://pylabo.vercel.app");
  });

  it("プレビューやローカルでは null を返すだけ", () => {
    expect(resolveSiteUrlOrFail({ VERCEL: "1", VERCEL_ENV: "preview" })).toBeNull();
    expect(resolveSiteUrlOrFail({})).toBeNull();
  });
});
