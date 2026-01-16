import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
let loginFailureRate = new Rate("login_failures");
let authFailureRate = new Rate("auth_failures");
let apiResponseTime = new Trend("api_response_time");

export let options = {
    stages: [
        { duration: "30s", target: 50 },   // ramp up to 50 users
        { duration: "1m", target: 150 },   // stay at 150 users
        { duration: "1m", target: 300 },   // ramp up to 300 users
        { duration: "30s", target: 100 },  // ramp down to 100 users
        { duration: "30s", target: 0 },    // ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ["p(95)<500"], // 95% of requests must complete below 500ms
        http_req_failed: ["rate<0.1"],    // error rate must be below 10%
        login_failures: ["rate<0.05"],    // login failure rate below 5%
        auth_failures: ["rate<0.02"],     // auth failure rate below 2%
    },
};

const BASE_URL = "http://localhost:8080/api/v1";

// Helper function to generate random data
function generateRandomUser() {
    const userIds = [1, 2, 3];
    return {
        username: `user${userIds[Math.floor(Math.random() * userIds.length)]}`,
        password: "admin",
    };
}

// Login function
function login() {
    const payload = JSON.stringify(generateRandomUser());
    const params = {
        headers: {
            "Content-Type": "application/json",
        },
    };
    
    let res = http.post(`${BASE_URL}/auth/login`, payload, params);
    
    let success = check(res, {
        "login status is 200": (r) => r.status === 200,
        "login response has token": (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.accessToken !== undefined;
            } catch (e) {
                return false;
            }
        },
    });
    
    loginFailureRate.add(!success);
    apiResponseTime.add(res.timings.duration);
    
    if (success) {
        try {
            const body = JSON.parse(res.body);
            return body.token;
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Authenticated API call
function makeAuthenticatedRequest(token, endpoint, method = "GET") {
    const params = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    };
    
    let res;
    if (method === "GET") {
        res = http.get(`${BASE_URL}${endpoint}`, params);
    } else if (method === "POST") {
        const payload = JSON.stringify({
            title: `Test Post ${Date.now()}`,
            content: "This is a load test post",
        });
        res = http.post(`${BASE_URL}${endpoint}`, payload, params);
    }
    
    let success = check(res, {
        [`${endpoint} status is 200 or 201`]: (r) => r.status === 200 || r.status === 201,
        [`${endpoint} has response body`]: (r) => r.body.length > 0,
    });
    
    authFailureRate.add(!success);
    apiResponseTime.add(res.timings.duration);
    
    return res;
}

export default function () {
    group("User Login Flow", function () {
        // Login
        let token = login();
        sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
        
        if (token) {
            group("Authenticated Operations", function () {
                // Simulate browsing different endpoints
                const endpoints = [
                    "/users/profile",
                    "/posts",
                    "/dashboard",
                    "/settings",
                ];
                
                // Random endpoint access
                const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
                makeAuthenticatedRequest(token, randomEndpoint);
                sleep(Math.random() * 1.5 + 0.5);
                
                // 30% chance to make a POST request
                if (Math.random() < 0.3) {
                    makeAuthenticatedRequest(token, "/posts", "POST");
                    sleep(Math.random() * 1 + 0.5);
                }
                
                // 20% chance to access multiple endpoints
                if (Math.random() < 0.2) {
                    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
                        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
                        makeAuthenticatedRequest(token, endpoint);
                        sleep(Math.random() * 0.5);
                    }
                }
            });
        }
        
        sleep(Math.random() * 2 + 1);
    });
}

// Setup function - runs once at the start
export function setup() {
    console.log("Starting load test...");
    console.log(`Base URL: ${BASE_URL}`);
    return { timestamp: new Date().toISOString() };
}

// Teardown function - runs once at the end
export function teardown(data) {
    console.log("Load test completed!");
    console.log(`Started at: ${data.timestamp}`);
    console.log(`Ended at: ${new Date().toISOString()}`);
}