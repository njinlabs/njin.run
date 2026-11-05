---
title: EdgeJS cheatsheet
description: The template syntax you use most in njin pages.
---

# EdgeJS cheatsheet

njin renders pages with [EdgeJS](https://edgejs.dev). This page lists the parts you will use most. Everything here works in pages, layouts and components.

## Output

```edge
{{ title }}       {{-- escaped: safe for any text --}}
{{{ html }}}      {{-- not escaped: only for trusted HTML --}}
```

Use three braces for a `richtext` field and for slot output. Use two for everything else.

Anything inside the braces is a JavaScript expression:

```edge
{{ item.price * 2 }}
{{ request.path === '/about' ? 'active' : '' }}
{{ item.tags.join(', ') }}
```

## Variables

```edge
@let(name = 'value')
@let(result = await post.read({}))
@let(page = Number(query.page || 1))
```

Use `await` for anything async, such as model methods.

## Conditionals

```edge
@if(items.length > 5)
  many
@elseif(items.length > 1)
  some
@else
  few
@end
```

Put the body of a tag on its own lines. A one-line form such as `@if(!item){{ abort(404) }}@end` does not parse.

## Loops

```edge
@each(item in result.data)
  {{ item.title }}
@end
```

To get the index, name two variables:

```edge
@each((item, index) in result.data)
  {{ index }}: {{ item.title }}
@end
```

`@else` inside a loop renders when the list is empty:

```edge
@each(item in result.data)
  {{ item.title }}
@else
  Nothing here yet.
@end
```

## Components and slots

```edge
@component('components/card', { title: 'Hello' })
  @slot('footer')
    Footer text
  @end
  Body content
@end

@!component('components/divider')
```

`@!component` is the form without slot content. Inside a component, props are variables and slots are rendered with `await $slots.name()`. The content that is not in a named slot is `$slots.main`.

See [Layouts and pages](/docs/website/layouts-and-pages).

## Include

```edge
@include('partials/analytics')
```

`@include` takes only a template name and cannot pass props. Use a component for that.

## Comments

```edge
{{-- Not sent to the browser --}}
```

## Common patterns

```edge
{{-- Active link --}}
<a class="{{ request.path === '/blog' ? 'font-bold' : '' }}" href="/blog">Blog</a>

{{-- An optional value with a fallback --}}
<title>{{ item.seo?.metaTitle ?? item.title }}</title>

{{-- Stop with a 404 --}}
@if(!item)
  {{ abort(404) }}
@end
```
