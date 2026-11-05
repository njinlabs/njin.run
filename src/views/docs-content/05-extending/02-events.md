---
title: Events
description: Notify other parts of your app that something happened.
---

# Events

An event is a message that says "something happened", such as an order being paid. Any number of listeners can react to it, and the code that dispatched it does not need to know about them.

## Events vs. hooks

| | Hooks | Events |
| --- | --- | --- |
| Belong to | One model or vars group | Nothing in particular. You dispatch them yourself |
| Can stop the operation | Yes, a `before` hook can throw to cancel | No |
| A listener that throws | Fails the operation | Is logged, and the rest still run |

Use a hook to change or guard what a model does. Use an event to fan out a notification. See [Hooks](/docs/models/hooks).

## Defining an event

`makeEvent()` creates an event. Its type argument is the payload:

```ts
// src/events/order_paid.ts
import { makeEvent } from "@njinlabs/njin";

const orderPaid = makeEvent<{ orderId: string; total: number }>();

export default orderPaid;
```

An event has no name. Dispatching and listening are matched by sharing the same object, so define each event in one file and import it wherever you need it. Because the payload type belongs to that object, `dispatch` and `listen` always agree on its shape.

## Listening

Put listeners in their own file:

```ts
// src/events/listeners/send_receipt.ts
import orderPaid from "../order_paid";

orderPaid.listen(async (payload) => {
  // send an email using payload.orderId and payload.total
});
```

Register the listener file in `config.ts`. It is imported when the server starts, and importing it runs the `listen()` call:

```ts
export default defineConfig({
  events: [() => import("./src/events/listeners/send_receipt")],
});
```

Restart the dev server after adding a listener file.

## Dispatching

Call `dispatch()` from anywhere in your server code. A common place is a model hook:

```ts
import { afterCreate } from "@njinlabs/njin";
import orderPaid from "../events/order_paid";
import order from "../models/order";

afterCreate(order, (record) => {
  orderPaid.dispatch({ orderId: record.id, total: record.total });
});
```

`dispatch()` runs the listeners one after another, in the order they were registered, and returns a promise that settles when all of them are done. You can `await` it when you need to wait, or ignore it to carry on without waiting.

## When a listener fails

If a listener throws or rejects, the error is written to the log and the next listener still runs. The error never reaches the code that dispatched the event.

Inside listeners, use `logger()` from `@njinlabs/njin/logger` instead of `console`, so output reaches your configured log streams. Call it inside the function, not at the top of the file:

```ts
import logger from "@njinlabs/njin/logger";

orderPaid.listen((payload) => {
  logger().info({ orderId: payload.orderId }, "order paid");
});
```

## Things to know

- Events live in memory in one process. A listener only hears events dispatched by the same running server.
- The payload is passed by reference. Do not change it in a listener if others use it.
