import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { indentUnit } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";

import { useTheme } from "../lib/theme-context";

interface Props {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  /** Ctrl / ⌘ + Enter で呼ばれる */
  onRun?: () => void;
}

export function CodeEditor({ value, onChange, readOnly = false, onRun }: Props) {
  const { theme } = useTheme();

  const extensions = useMemo(() => {
    const runKeymap = Prec.highest(
      keymap.of([
        {
          key: "Mod-Enter",
          preventDefault: true,
          run: () => {
            onRun?.();
            return true;
          },
        },
      ])
    );
    // Python の字下げは半角スペース 4 つが標準
    return [python(), indentUnit.of("    "), EditorView.lineWrapping, runKeymap];
  }, [onRun]);

  return (
    <div className="editor">
      <CodeMirror
        value={value}
        theme={theme === "dark" ? githubDark : githubLight}
        extensions={extensions}
        editable={!readOnly}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          autocompletion: false,
          highlightActiveLine: !readOnly,
          highlightActiveLineGutter: !readOnly,
          searchKeymap: false,
        }}
      />
    </div>
  );
}
