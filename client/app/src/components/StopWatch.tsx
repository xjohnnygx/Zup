import { useState, useEffect, useRef } from "react";

type StopWatchProps = {
    minutes: number;
    seconds: number;
};

function StopWatch(props: StopWatchProps): JSX.Element {

    const [time, setTime] = useState({ minutes: props.minutes, seconds: props.seconds});
    const interval = useRef<NodeJS.Timer>();

    function padNumber(num: number): string {
        return num.toString().padStart(2, "0");
    }

    function updateStopWatch(): void {
        setTime(time => {
            if (time.minutes === 0 && time.seconds === 0) {
                clearInterval(interval.current);
                return time;
            }
            return {
                minutes: (time.seconds === 0) ? --time.minutes : time.minutes,
                seconds: (time.seconds === 0) ? 59 : --time.seconds
            };
        });
    }

    useEffect(function() {
        interval.current = setInterval(updateStopWatch, 1000);
    },[]);

    return (
        <>
            <div>{padNumber(time.minutes) + ":" + padNumber(time.seconds)}</div>
        </>
    );
}

export default StopWatch;