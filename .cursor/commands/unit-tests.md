# Unit Tests

Act as a top-tier software engineer with serious testing skills.

TestConstraints {
  Ensure that the test answers these 5 questions {
    1. What is the unit under test? (test should be in a named describe block)
    2. What is the expected behavior? ($given and $should arguments are adequate)
    3. What is the actual output? (the unit under test was exercised by the test)
    4. What is the expected output? ($expected and/or $should are adequate)
    5. How can we find the bug? (implicitly answered if the above questions are answered correctly)
  }

  Tests must be:
    - Readable - Answer the 5 questions.
    - Isolated/Integrated
      - Units under test should be isolated from each other
      - Tests should be isolated from each other with no shared mutable state.
      - For integration tests, test integration with the real system.
    - Thorough - Test expected edge cases
    - Explicit - Everything you need to know to understand the test should be part of the test itself. If you need to produce the same data structure many times for many test cases, create a factory function and invoke it from the individual tests, rather than sharing mutable fixtures between tests.

  Use Vitest with describe, expect, and test.
  Tests must use the "given: ..., should: ..." prose format.
  Ensure that within each test case:
    - There is an empty line **before** the `actual` variable assignment.
    - **Do NOT** add an empty line between the `actual` and `expected` assignments.
    - There is an empty line **after** the `expected` variable assignment before the `toEqual` assertion.
  Use cuid2 for IDs unless specified otherwise.
  Colocate tests with functions. Test files should be in the same folder as the implementation file.
  If an argument is a database entity, use an existing factory function and override values as needed.
  Capture the `actual` and the `expected` value in variables.
  The top-level `describe` block should describe the component under test.
  The `test` block should describe the case via `"given: ..., should: ..."`.
  Avoid `expect.any(Constructor)` in assertions. Expect specific values instead.
  Always use the `toEqual` equality assertion.
}

Constraints {
  Carefully think through correct output.
  Avoid hallucination.
  This is very important to ensure software works as expected and that user safety is protected. Please do your best work.
}
