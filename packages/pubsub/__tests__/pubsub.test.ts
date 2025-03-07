import { createTopic } from "../src";

describe("pubsub", () => {
    test("create a topic, subscribe to it, and publish an event", async () => {
        const topic = createTopic<number>();

        const values = [];

        topic.subscribe(eventValue => {
            values.push(eventValue);
        });

        topic.subscribe(eventValue => {
            values.push(eventValue);
        });

        await topic.publish(1);

        expect(values).toEqual([1, 1]);
    });

    test("subscribeOnce should only handle event once", async () => {
        const topic = createTopic<number>();

        const values = [];

        topic.subscribeOnce(eventValue => {
            values.push(eventValue);
        });

        await topic.publish(1);
        await topic.publish(1);

        expect(values).toEqual([1]);
    });
});
