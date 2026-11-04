
"use strict";

/* =====================================
   CALCNOVA - COMPLETE JAVASCRIPT ENGINE
   10 WORKING CALCULATORS
===================================== */

const $ = id => document.getElementById(id);

const format = n => Number(n).toLocaleString("en-IN", {
    maximumFractionDigits: 2
});

function result(html) {
    $("calcResult").innerHTML = html;
}

function getValue(id) {
    const el = $(id);
    if (!el || el.value.trim() === "") {
        throw new Error("Please fill all required fields.");
    }

    const value = Number(el.value);

    if (!Number.isFinite(value)) {
        throw new Error("Please enter a valid number.");
    }

    return value;
}

function run(fn) {
    try {
        fn();
    } catch (error) {
        result(`<span class="error">${error.message}</span>`);
    }
}

function inputField(label, id, placeholder, type = "number") {
    return `
        <label class="calc-field">
            ${label}
            <input
                type="${type}"
                id="${id}"
                placeholder="${placeholder || ""}"
                ${type === "number" ? 'step="any"' : ""}
            >
        </label>
    `;
}

function selectField(label, id, options) {
    return `
        <label class="calc-field">
            ${label}
            <select id="${id}">
                ${options.map(o =>
                    `<option value="${o.value}">${o.label}</option>`
                ).join("")}
            </select>
        </label>
    `;
}

function actionButton(label, fn) {
    return `<button class="calc-action" onclick="${fn}">${label}</button>`;
}

function resultArea() {
    return `<div id="calcResult" class="calc-result">
        Your calculation result will appear here.
    </div>`;
}

/* =====================================
   1. SEARCH SYSTEM
===================================== */

function searchCalculators() {
    const query = $("searchInput").value.toLowerCase().trim();
    let found = 0;

    document.querySelectorAll(".calc-card").forEach(card => {
        const text = (
            card.innerText + " " + card.dataset.name
        ).toLowerCase();

        const match = text.includes(query);

        card.style.display = match ? "" : "none";

        if (match) found++;
    });

    $("noResults").hidden = found !== 0;
}

$("searchInput").addEventListener("input", searchCalculators);

/* =====================================
   2. MOBILE NAVIGATION
===================================== */

function toggleMenu() {
    $("nav").classList.toggle("show");
}

document.querySelectorAll("#nav a").forEach(link => {
    link.addEventListener("click", () => {
        $("nav").classList.remove("show");
    });
});

/* =====================================
   3. MODAL SYSTEM
===================================== */

const calculatorTitles = {
    basic: "Basic Calculator",
    scientific: "Scientific Calculator",
    age: "Age Calculator",
    bmi: "BMI Calculator",
    emi: "EMI Calculator",
    gst: "GST Calculator",
    percentage: "Percentage Calculator",
    discount: "Discount Calculator",
    sip: "SIP Calculator",
    date: "Date Calculator"
};

const calculators = {
    basic: basicCalculator,
    scientific: scientificCalculator,
    age: ageCalculator,
    bmi: bmiCalculator,
    emi: emiCalculator,
    gst: gstCalculator,
    percentage: percentageCalculator,
    discount: discountCalculator,
    sip: sipCalculator,
    date: dateCalculator
};

function openCalculator(type) {
    if (!calculators[type]) return;

    $("calculatorContent").innerHTML = `
        <h2 class="calc-title">${calculatorTitles[type]}</h2>
        <div id="calcBody"></div>
    `;

    $("calculatorModal").classList.add("active");
    $("calculatorModal").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    calculators[type]();
}

function closeCalculator() {
    $("calculatorModal").classList.remove("active");
    $("calculatorModal").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

$("calculatorModal").addEventListener("click", event => {
    if (event.target === $("calculatorModal")) {
        closeCalculator();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCalculator();
});

/* =====================================
   4. SAFE MATHEMATICAL PARSER
===================================== */

function calculateExpression(expression, scientific = false) {
    const pattern = scientific
        ? /sin|cos|tan|log|sqrt|\d+(?:\.\d+)?|[()+\-*/^]/g
        : /\d+(?:\.\d+)?|[()+\-*/^]/g;

    const tokens = expression.match(pattern);

    if (!tokens || tokens.join("") !== expression.replace(/\s/g, "")) {
        throw new Error("Invalid mathematical expression.");
    }

    let pos = 0;

    function primary() {
        const token = tokens[pos++];

        if (token === undefined) throw new Error("Incomplete expression.");

        if (token === "+") return primary();
        if (token === "-") return -primary();

        if (token === "(") {
            const value = addSub();
            if (tokens[pos++] !== ")") throw new Error("Missing closing bracket.");
            return value;
        }

        if (scientific && ["sin", "cos", "tan", "log", "sqrt"].includes(token)) {
            if (tokens[pos++] !== "(") throw new Error("Function needs opening bracket.");

            const x = addSub();

            if (tokens[pos++] !== ")") throw new Error("Function needs closing bracket.");

            switch (token) {
                case "sin": return Math.sin(x * Math.PI / 180);
                case "cos": return Math.cos(x * Math.PI / 180);
                case "tan": return Math.tan(x * Math.PI / 180);
                case "log":
                    if (x <= 0) throw new Error("Log requires a positive number.");
                    return Math.log10(x);
                case "sqrt":
                    if (x < 0) throw new Error("Square root cannot be negative.");
                    return Math.sqrt(x);
            }
        }

        const number = Number(token);

        if (!Number.isFinite(number)) throw new Error("Invalid number.");

        return number;
    }

    function power() {
        const a = primary();

        if (tokens[pos] === "^") {
            pos++;
            return Math.pow(a, power());
        }

        return a;
    }

    function multiplyDivide() {
        let value = power();

        while (tokens[pos] === "*" || tokens[pos] === "/") {
            const operator = tokens[pos++];
            const next = power();

            value = operator === "*" ? value * next : value / next;
        }

        return value;
    }

    function addSub() {
        let value = multiplyDivide();

        while (tokens[pos] === "+" || tokens[pos] === "-") {
            const operator = tokens[pos++];
            const next = multiplyDivide();

            value = operator === "+" ? value + next : value - next;
        }

        return value;
    }

    const answer = addSub();

    if (pos !== tokens.length || !Number.isFinite(answer)) {
        throw new Error("Invalid calculation or division by zero.");
    }

    return answer;
}

/* =====================================
   5. BASIC CALCULATOR
===================================== */

function basicCalculator() {
    $("calcBody").innerHTML = `
        <input id="basicDisplay" class="basic-display"
        placeholder="0" readonly>

        <div class="basic-grid">
            ${["C","DEL","(",")","7","8","9","/",
            "4","5","6","*","1","2","3","-","0",".","=","+"]
            .map(key => `
                <button onclick="basicPress('${key}')">${key}</button>
            `).join("")}
        </div>
    `;
}

function basicPress(key) {
    const display = $("basicDisplay");

    if (key === "C") {
        display.value = "";
        return;
    }

    if (key === "DEL") {
        display.value = display.value.slice(0, -1);
        return;
    }

    if (key === "=") {
        try {
            display.value = format(calculateExpression(display.value));
        } catch {
            display.value = "Error";
        }
        return;
    }

    if (display.value === "Error") display.value = "";

    display.value += key;
}

/* =====================================
   6. SCIENTIFIC CALCULATOR
===================================== */

function scientificCalculator() {
    $("calcBody").innerHTML = `
        <input id="sciDisplay" class="basic-display"
        placeholder="0" readonly>

        <div class="basic-grid">
            ${["C","DEL","(",")","7","8","9","/",
            "4","5","6","*","1","2","3","-",
            "0",".","^","+","sin","cos","tan","log","sqrt","="]
            .map(key => `
                <button onclick="scientificPress('${key}')">${key}</button>
            `).join("")}
        </div>

        <p class="calc-hint">Trigonometry uses degrees.</p>
    `;
}

function scientificPress(key) {
    const display = $("sciDisplay");

    if (key === "C") {
        display.value = "";
        return;
    }

    if (key === "DEL") {
        display.value = display.value.slice(0, -1);
        return;
    }

    if (key === "=") {
        try {
            display.value = format(
                calculateExpression(display.value, true)
            );
        } catch (error) {
            display.value = "Error";
        }
        return;
    }

    if (display.value === "Error") display.value = "";

    if (["sin","cos","tan","log","sqrt"].includes(key)) {
        display.value += key + "(";
    } else {
        display.value += key;
    }
}

/* =====================================
   7. AGE CALCULATOR
===================================== */

function ageCalculator() {
    $("calcBody").innerHTML = `
        ${inputField("Date of Birth", "birthDate", "", "date")}
        ${actionButton("Calculate My Age", "run(calculateAge)")}
        ${resultArea()}
    `;
}

function calculateAge() {
    const value = $("birthDate").value;

    if (!value) throw new Error("Please select your birth date.");

    const birth = new Date(value + "T00:00:00");
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (isNaN(birth) || birth > today) {
        throw new Error("Please enter a valid past date.");
    }

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
        months--;
        days += new Date(
            today.getFullYear(),
            today.getMonth(),
            0
        ).getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    result(`
        <strong>${years} Years</strong><br>
        ${months} Months<br>
        ${days} Days
    `);
}

/* =====================================
   8. BMI CALCULATOR
===================================== */

function bmiCalculator() {
    $("calcBody").innerHTML = `
        ${inputField("Weight (kg)", "bmiWeight", "65")}
        ${inputField("Height (cm)", "bmiHeight", "170")}
        ${actionButton("Calculate BMI", "run(calculateBMI)")}
        ${resultArea()}
    `;
}

function calculateBMI() {
    const weight = getValue("bmiWeight");
    const height = getValue("bmiHeight") / 100;

    if (weight <= 0 || weight > 1000 || height <= 0 || height > 3) {
        throw new Error("Enter valid height and weight.");
    }

    const bmi = weight / (height * height);

    const category = bmi < 18.5
        ? "Underweight"
        : bmi < 25
        ? "Normal Weight"
        : bmi < 30
        ? "Overweight"
        : "Obesity";

    result(`
        Your BMI: <strong>${bmi.toFixed(2)}</strong><br>
        Category: <strong>${category}</strong><br>
        <small>Adult BMI categories are screening guidelines, not a diagnosis.</small>
    `);
}

/* =====================================
   9. EMI CALCULATOR
===================================== */

function emiCalculator() {
    $("calcBody").innerHTML = `
        ${inputField("Loan Amount (₹)", "loanAmount", "500000")}
        ${inputField("Annual Interest Rate (%)", "loanRate", "9")}
        ${inputField("Loan Duration (Years)", "loanYears", "5")}
        ${actionButton("Calculate EMI", "run(calculateEMI)")}
        ${resultArea()}
    `;
}

function calculateEMI() {
    const principal = getValue("loanAmount");
    const rate = getValue("loanRate");
    const years = getValue("loanYears");

    if (principal <= 0 || rate < 0 || years <= 0 || years > 100) {
        throw new Error("Enter valid loan details.");
    }

    const months = years * 12;
    const monthlyRate = rate / 1200;

    const emi = monthlyRate === 0
        ? principal / months
        : principal * monthlyRate *
        Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1);

    const total = emi * months;

    result(`
        Monthly EMI: <strong>₹${format(emi)}</strong><br>
        Total Payment: ₹${format(total)}<br>
        Total Interest: ₹${format(total - principal)}
    `);
}

/* =====================================
   10. GST CALCULATOR
===================================== */

function gstCalculator() {
    $("calcBody").innerHTML = `
        ${inputField("Amount (₹)", "gstAmount", "1000")}

        ${selectField("GST Rate", "gstRate", [
            {value:5,label:"5%"},
            {value:12,label:"12%"},
            {value:18,label:"18%"},
            {value:28,label:"28%"}
        ])}

        ${selectField("Calculation Type", "gstType", [
            {value:"add",label:"Add GST"},
            {value:"remove",label:"Remove GST"}
        ])}

        ${actionButton("Calculate GST", "run(calculateGST)")}
        ${resultArea()}
    `;
}

function calculateGST() {
    const amount = getValue("gstAmount");
    const rate = Number($("gstRate").value);
    const type = $("gstType").value;

    if (amount < 0) throw new Error("Enter a valid amount.");

    const base = type === "add"
        ? amount
        : amount / (1 + rate / 100);

    const total = type === "add"
        ? amount * (1 + rate / 100)
        : amount;

    const gst = total - base;

    result(`
        Original Amount: ₹${format(base)}<br>
        GST Amount: ₹${format(gst)}<br>
        Final Amount: <strong>₹${format(total)}</strong>
    `);
}

/* =====================================
   11. PERCENTAGE CALCULATOR
===================================== */

function percentageCalculator() {
    $("calcBody").innerHTML = `
        ${inputField("Obtained Marks / Value", "percentValue", "450")}
        ${inputField("Total Marks / Value", "percentTotal", "500")}
        ${actionButton("Calculate Percentage", "run(calculatePercentage)")}
        ${resultArea()}
    `;
}

function calculatePercentage() {
    const value = getValue("percentValue");
    const total = getValue("percentTotal");

    if (total <= 0) throw new Error("Total must be greater than zero.");

    result(`
        Your Percentage:<br>
        <strong>${(value / total * 100).toFixed(2)}%</strong>
    `);
}

/* =====================================
   12. DISCOUNT CALCULATOR
===================================== */

function discountCalculator() {
    $("calcBody").innerHTML = `
        ${inputField("Original Price (₹)", "originalPrice", "2000")}
        ${inputField("Discount (%)", "discountRate", "25")}
        ${actionButton("Calculate Discount", "run(calculateDiscount)")}
        ${resultArea()}
    `;
}

function calculateDiscount() {
    const price = getValue("originalPrice");
    const discount = getValue("discountRate");

    if (price < 0 || discount < 0 || discount > 100) {
        throw new Error("Enter valid price and discount.");
    }

    const saved = price * discount / 100;

    result(`
        Original Price: ₹${format(price)}<br>
        Discount: ₹${format(saved)}<br>
        Final Price: <strong>₹${format(price - saved)}</strong>
    `);
}

/* =====================================
   13. SIP CALCULATOR
===================================== */

function sipCalculator() {
    $("calcBody").innerHTML = `
        ${inputField("Monthly Investment (₹)", "sipAmount", "2000")}
        ${inputField("Expected Annual Return (%)", "sipRate", "12")}
        ${inputField("Investment Duration (Years)", "sipYears", "10")}
        ${actionButton("Calculate SIP", "run(calculateSIP)")}
        ${resultArea()}
        <p class="calc-hint">Estimated returns are not guaranteed.</p>
    `;
}

function calculateSIP() {
    const monthly = getValue("sipAmount");
    const annual = getValue("sipRate");
    const years = getValue("sipYears");

    if (monthly <= 0 || annual < 0 || annual > 100 || years <= 0 || years > 100) {
        throw new Error("Enter valid investment details.");
    }

    const months = years * 12;
    const rate = Math.pow(1 + annual / 100, 1 / 12) - 1;

    const invested = monthly * months;

    const futureValue = rate === 0
        ? invested
        : monthly * (Math.pow(1 + rate, months) - 1) / rate * (1 + rate);

    result(`
        Total Investment: ₹${format(invested)}<br>
        Estimated Returns: ₹${format(futureValue - invested)}<br>
        Future Value: <strong>₹${format(futureValue)}</strong>
    `);
}

/* =====================================
   14. DATE CALCULATOR
===================================== */

function dateCalculator() {
    $("calcBody").innerHTML = `
        ${inputField("Start Date", "startDate", "", "date")}
        ${inputField("End Date", "endDate", "", "date")}
        ${actionButton("Calculate Difference", "run(calculateDate)")}
        ${resultArea()}
    `;
}

function calculateDate() {
    const start = $("startDate").value;
    const end = $("endDate").value;

    if (!start || !end) throw new Error("Select both dates.");

    const a = new Date(start + "T00:00:00Z");
    const b = new Date(end + "T00:00:00Z");

    if (isNaN(a) || isNaN(b)) throw new Error("Invalid dates.");

    const days = Math.abs(b - a) / 86400000;

    const years = Math.floor(days / 365.2425);
    const months = Math.floor((days - years * 365.2425) / 30.436875);

    result(`
        Total Difference: <strong>${format(days)} Days</strong><br>
        Approximately ${years} Years<br>
        Approximately ${months} Months
    `);
}

console.log("CalcNova: All 10 calculators loaded successfully.");
