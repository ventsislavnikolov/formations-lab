// Conventional commits, as in next1-360, so semantic-release can read the
// history later: feat → minor, fix → patch, "!" or BREAKING CHANGE → major.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0],
  },
};
