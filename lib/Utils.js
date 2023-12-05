/**
 * Waits for a specified amount of time and then calls a callback function.
 *
 * @param {Function} callback - The function to call after waiting.
 * @param {number} [ms=2500] - The amount of time to wait, in milliseconds.
 * @returns {Promise<any>} A promise that resolves with the result of the callback, or rejects with any error that occurs when calling the callback.
 * @throws {Error} If there was an error executing the callback function.
 */
export function waitFor(callback, ms = 2500) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const result = callback();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, ms);
    });
}
