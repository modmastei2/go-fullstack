import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
    stages: [
        { duration: "30s", target: 50 }, // ramp up to 50 users
        { duration: "1m", target: 150 },  // stay at 150 users
        { duration: "30s", target: 26 },  // ramp down to 26 users
        { duration: "10s", target: 0 },    // ramp down to 0 users
    ],
};

export default function () {
    const url = "http://localhost:8080/api/login";
    const payload = JSON.stringify({
        username: `user${Math.floor(Math.random() * 3) + 1}`, // user1, user2, or user3
        password: "admin",
    });
    const params = {
        headers: {
            "Content-Type": "application/json",
        },
    };
    let res = http.post(url, payload, params);
    check(res, {
        "is status 200": (r) => r.status === 200,
    });
    sleep(1);
}