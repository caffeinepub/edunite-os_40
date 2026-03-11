import { X } from "lucide-react";
import { useState } from "react";
import {
  type BankComment,
  COMMENT_CATEGORIES,
  type CommentCategory,
  addBankComment,
  deleteBankComment,
  getBankComments,
} from "../../lib/commentBank";

interface CommentBankPanelProps {
  onInsert: (text: string) => void;
}

export default function CommentBankPanel({ onInsert }: CommentBankPanelProps) {
  const [activeCategory, setActiveCategory] =
    useState<CommentCategory>("Academic");
  const [allComments, setAllComments] = useState<BankComment[]>(() =>
    getBankComments(),
  );
  const [newText, setNewText] = useState("");

  const visibleComments = allComments.filter(
    (c) => c.category === activeCategory,
  );

  function handleAdd() {
    if (!newText.trim()) return;
    addBankComment(newText.trim(), activeCategory);
    setAllComments(getBankComments());
    setNewText("");
  }

  function handleDelete(id: number) {
    deleteBankComment(id);
    setAllComments(getBankComments());
  }

  return (
    <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-3">
      {/* Category pill tabs */}
      <div className="flex flex-wrap gap-1.5">
        {COMMENT_CATEGORIES.map((cat) => {
          const count = allComments.filter((c) => c.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              }`}
              data-ocid={`comment_bank.${cat.toLowerCase()}.tab`}
            >
              {cat}
              <span
                className={`text-xs rounded-full px-1.5 py-0 leading-4 ${
                  activeCategory === cat
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Comment list */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {visibleComments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-1 py-2">
            No {activeCategory.toLowerCase()} comments yet. Add one below.
          </p>
        ) : (
          visibleComments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start gap-2 px-3 py-2 rounded-md bg-card border border-border group"
            >
              <p className="text-xs text-foreground flex-1 leading-relaxed">
                {comment.text}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onInsert(comment.text)}
                  className="text-xs text-primary font-medium hover:underline"
                  data-ocid="comment_bank.comment.button"
                >
                  Use
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Delete comment"
                  data-ocid="comment_bank.comment.delete_button"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add new comment */}
      <div className="flex gap-2 pt-1 border-t border-border">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={`Add a ${activeCategory.toLowerCase()} comment...`}
          className="flex-1 h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          data-ocid="comment_bank.add.input"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newText.trim()}
          className="h-8 px-3 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors disabled:opacity-40"
          data-ocid="comment_bank.add.button"
        >
          Add
        </button>
      </div>
    </div>
  );
}
