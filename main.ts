let dial = {
    active: false,
    onDone: function (result: number) { },
    lastEventAccYStatus: 0,
    lastEventAccXStatus: 0,
    sence: 400,
    digit: 0,
    num: 0,
    eventSource: EventBusSource.MICROBIT_ID_IO_P0,
    eventValueUp: EventBusValue.MES_ALERT_EVT_ALARM2,
    eventValueDown: EventBusValue.MES_ALERT_EVT_ALARM1,
    eventValueNext: EventBusValue.MES_ALERT_EVT_ALARM3,
    digitsPixels: [
        [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [0, 3], [3, 3], [1, 4], [2, 4]],
        [[2, 0], [1, 1], [2, 1], [2, 2], [2, 3], [1, 4], [2, 4], [3, 4]],
        [[0, 0], [1, 0], [2, 0], [3, 1], [2, 2], [1, 2], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4]],
        [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [2, 2], [0, 3], [3, 3], [1, 4], [2, 4]],
        [[2, 0], [3, 0], [1, 1], [3, 1], [0, 2], [3, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [3, 4]],
        [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 3], [0, 4], [1, 4], [2, 4], [3, 4]],
        [[3, 0], [2, 1], [1, 2], [2, 2], [3, 2], [0, 3], [4, 3], [1, 4], [2, 4], [3, 4]],
        [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [3, 1], [2, 2], [1, 3], [0, 4]],
        [[1, 0], [2, 0], [3, 0], [0, 1], [4, 1], [1, 2], [2, 2], [3, 2], [0, 3], [4, 3], [1, 4], [2, 4], [3, 4]],
        [[1, 0], [2, 0], [3, 0], [0, 1], [4, 1], [1, 2], [2, 2], [3, 2], [2, 3], [1, 4]],
    ],
    registerHandlers: function () {
        control.onEvent(dial.eventSource, dial.eventValueDown, function () {
            if (!dial.active) { return }
            dial.digit = dial.scrollDownDigit(dial.digit);
        })
        control.onEvent(dial.eventSource, dial.eventValueUp, function () {
            if (!dial.active) { return }
            dial.digit = dial.scrollUpDigit(dial.digit);
        })
        control.onEvent(dial.eventSource, dial.eventValueNext, function () {
            if (!dial.active) { return }
            dial.scrollLeft(dial.digit, 0);
        })
        input.onButtonPressed(Button.B, function () {
            if (!dial.active) { return }
            dial.active = false;
            dial.onDone(dial.digit)
        })
    },
    plot: function (pixels: Array<Array<number>>, x: number, y: number) {
        helpers.arrayForEach(pixels, function (value: Array<number>) {
            led.plot(value[0] + x, value[1] + y)
        })
    },
    plotDigit: function (digit: number) {
        dial.plot(dial.digitsPixels[digit], 0, 0);
    },
    scrollUpDigit: function (digit: number) {
        dial.active = false
        let nextDigit = digit - 1
        if (nextDigit < 0) { nextDigit = 9 }
        let scrollTimes = [80, 70, 50, 40, 50, 70, 80];
        for (let i = 0; i > -7; i--) {
            basic.clearScreen()
            dial.plot(dial.digitsPixels[digit], 0, i)
            dial.plot(dial.digitsPixels[nextDigit], 0, i + 6)
            basic.pause(scrollTimes.pop())
        }
        dial.active = true
        return nextDigit;
    },
    scrollDownDigit: function (digit: number) {
        dial.active = false
        let nextDigit = digit + 1
        if (nextDigit > 9) { nextDigit = 0 }
        let scrollTimes = [80, 70, 50, 40, 50, 70, 80];
        for (let i = 0; i < 7; i++) {
            basic.clearScreen()
            dial.plot(dial.digitsPixels[digit], 0, i)
            dial.plot(dial.digitsPixels[nextDigit], 0, i - 6)
            basic.pause(scrollTimes.pop())
        }
        dial.active = true
        return nextDigit;
    },
    scrollLeft: function (digitLeft: number, digitRight: number) {
        dial.active = false
        let scrollTimes = [80, 70, 50, 40, 50, 70, 80];
        for (let i = 0; i > -7; i--) {
            basic.clearScreen()
            dial.plot(dial.digitsPixels[digitLeft], i, 0)
            dial.plot(dial.digitsPixels[digitRight], i + 6, 0)
            basic.pause(scrollTimes.pop())
        }
        dial.num = dial.num * 10 + dial.digit * 10
        dial.digit = digitRight
        dial.active = true
    },
    start: function (callback: (result: number) => void) {
        dial.onDone = callback
        dial.active = true;
        dial.digit = 0
        dial.num = 0
        dial.plotDigit(dial.digit);
    },
    handle: function () {
        let accY = input.acceleration(Dimension.Y);
        let accX = input.acceleration(Dimension.X);
        let yStatus: number = null;
        let xStatus: number = null;

        if (accY > -dial.sence / 2 && accY < dial.sence / 2) {
            yStatus = 0
        } else if (accY > dial.sence) {
            yStatus = 1
        } else if (accY < -dial.sence) {
            yStatus = -1
        }

        if (accX > -dial.sence / 2 && accX < dial.sence / 2) {
            xStatus = 0
        } else if (accX > dial.sence) {
            xStatus = 1
        } else if (accX < -dial.sence) {
            xStatus = -1
        }

        if (yStatus !== null && yStatus != dial.lastEventAccYStatus) {
            dial.lastEventAccYStatus = yStatus
            if (yStatus == 1) {
                control.raiseEvent(dial.eventSource, dial.eventValueDown);
            } else if (yStatus == -1) {
                control.raiseEvent(dial.eventSource, dial.eventValueUp);
            }
        }

        if (xStatus !== null && xStatus != dial.lastEventAccXStatus) {
            dial.lastEventAccXStatus = xStatus
            if (xStatus == 1) {
                control.raiseEvent(dial.eventSource, dial.eventValueNext);
            }
        }
    },
    readNumber: function () {
        let n: number = null
        let wait = true
        dial.start(function (result: number) {
            n = result
            wait = false
        })
        while (wait) {
            dial.handle()
            basic.pause(10)
        }
        return dial.num + dial.digit
    }
};

dial.registerHandlers()

basic.forever(function () {
    let a = Math.randomRange(1, 9)
    let b = Math.randomRange(1, 9)
    basic.showString(a + "*" + b + "=")
    let answer = dial.readNumber()
    if (answer == a * b) {
        basic.showIcon(IconNames.Yes)
        basic.pause(2000)
    } else {
        basic.showIcon(IconNames.No)
        basic.clearScreen()
        basic.pause(100)
        basic.showIcon(IconNames.No)
        basic.clearScreen()
        basic.pause(100)
        basic.showIcon(IconNames.No)
    }
    basic.clearScreen()
})
