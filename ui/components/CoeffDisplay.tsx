import { useState } from "react";

interface CodeDialogProps {
  matlabCode: string;
  onClose: () => void;
}

export function CodeDialog({ matlabCode, onClose }: CodeDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(matlabCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <span className="dialog-title">Generated MATLAB Code</span>
          <div className="dialog-actions">
            <button className="dialog-copy-btn" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </button>
            <button className="dialog-close" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className="dialog-body">
          <pre className="code-display">{matlabCode}</pre>
        </div>
      </div>
    </div>
  );
}

interface ShowCodeButtonProps {
  matlabCode: string | null;
}

export function ShowCodeButton({ matlabCode }: ShowCodeButtonProps) {
  const [open, setOpen] = useState(false);

  if (!matlabCode) return null;

  return (
    <>
      <button className="show-code-btn" onClick={() => setOpen(true)}>
        Show Code
      </button>
      {open && <CodeDialog matlabCode={matlabCode} onClose={() => setOpen(false)} />}
    </>
  );
}
