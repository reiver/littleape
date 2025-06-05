export class Queue {
    constructor() {
        this._queue = [];
        this._queuePromise = Promise.resolve();
        this._front = 0;
    }

    async enqueue(data) {
        await this._queuePromise;
        this._queue.push(data);
    }

    async dequeue() {
        await this._queuePromise;
        if (this._front === this._queue.length) {
            return null;
        }
        const data = this._queue[this._front];
        this._front++;
        return data;
    }

    isEmpty() {
        return this._front === this._queue.length;
    }
}
