# Contributing

## Issue titles and commit subjects follow different conventions

An issue names a problem that exists; a commit names a change that was made. They
are written differently, and reaching for the commit convention because it is the
one you already know is the specific mistake to avoid.

**An issue title** states the problem rather than the solution and stays under 60
characters - both are [Mozilla's bug writing guidelines][mozilla]. Nothing else
belongs in the title.

**A commit subject** follows [Conventional Commits][cc] - `type(scope): subject`,
imperative and lowercase. It names a change, where the issue title named a
problem, so the two are never the same sentence.

## Issue labels

The labels GitHub creates in every repository are the whole classification here,
and `bug`, `enhancement`, `documentation` and `question` are the type among them.
An issue carries one type; the two issue forms apply `bug` and `enhancement` for
you.

There is no priority label and no area label, on purpose. Each is an axis that
starts paying for itself once the queue is longer than one person can read, and
this one is not. Whichever is added first is written with the axis inside the
label - `priority: high`, `area: booking` - because a GitHub label namespace is
flat, unlike Bugzilla or Google's issue tracker where Priority and Component are
form fields that carry the axis name themselves.

An area names a part of the product a person reporting a problem can recognise:
booking, payments, search. Never a project, package or folder - nobody filing an
issue can choose between two of those.

---

The rules under `.claude/rules/` are the authority and carry the reasoning behind
each line above. This page exists only because GitHub links it from the issue and
pull request flow, where that directory is not in front of you.

[mozilla]: https://bugzilla.mozilla.org/page.cgi?id=bug-writing.html
[cc]: https://www.conventionalcommits.org/
