/**
 * Rejects CJK characters inside comments so the codebase stays English-only.
 * Prose in string literals is allowed because UI copy may be localized.
 */
const CJK = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/;

/** @type {import('eslint').Rule.RuleModule} */
export const noCjkComment = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow CJK characters inside comments',
    },
    schema: [],
    messages: {
      cjk: 'Comments must be written in English only. Remove CJK characters.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    const check = (comment) => {
      if (CJK.test(comment.value)) {
        context.report({ loc: comment.loc, messageId: 'cjk' });
      }
    };

    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          check(comment);
        }
      },
    };
  },
};

export default {
  rules: {
    'no-cjk-comment': noCjkComment,
  },
};
