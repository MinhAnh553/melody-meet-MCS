let setLoadingFunction = null;
let timeoutId = null;

export const loadingProxy = {
    register(fn) {
        setLoadingFunction = fn;
    },
    start() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            if (setLoadingFunction) setLoadingFunction(true);
        }, 400); // Chỉ show loading nếu sau 300ms chưa xong
    },
    stop() {
        clearTimeout(timeoutId);
        if (setLoadingFunction) setLoadingFunction(false);
    },
};
