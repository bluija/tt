// consent
const consent = document.querySelector('.consent');
const consentCheckbox = document.querySelector('.consentCheckbox');
const startButton = document.querySelector('.startButton');

// experiment
const minDots = 100
const maxDots = 200
const dotSize = 7;
const numTrial = 3;

// https://davidmathlogic.com/colorblind/#%23D81B60-%231E88E5-%23FFC107-%23004D40
const colors = new Map()
colors.set("Red", "#D81B60")
colors.set("Blue", "#1E88E5")
colors.set("Yellow", "#FFC107")
colors.set("Green", "#004D40")

const experiment = document.querySelector('.experiment');
const progressDisplay = document.querySelector('.progressDisplay');
const trial = document.querySelector('.trial');
const score = document.querySelector('.score');
const question = document.querySelector('.question');

const questionDisplay = document.querySelector('.questionDisplay');

const beforeForm = document.querySelector('.beforeForm');
const beforeField = document.querySelector('.beforeField');
const beforeSubmit = document.querySelector('.beforeSubmit');

const aiForm = document.querySelector('.aiForm');
const aiField = document.querySelector('.aiField');

const afterForm = document.querySelector('.afterForm');
const afterField = document.querySelector('.afterField');
const afterSubmit = document.querySelector('.afterSubmit');

// canvas
const canvasDisplay = document.querySelector('.canvasDisplay');
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const randIdx = len => Math.floor(Math.random() * len);
const idxClr = idx => Array.from(colors.keys())[idx];

const randDots = clr => {
    ctx.fillStyle = clr;
    ctx.fillRect(randIdx(canvas.width), randIdx(canvas.height), dotSize, dotSize);
};

const repeatDots = (len, clrKey) => {
    for (let i = 0; i < len; i++) {
        randDots(colors.get(clrKey));
    }
}

// complete
const complete = document.querySelector(".complete")

const commentDisplay = document.querySelector(".commentDisplay");
const commentField = document.getElementById("commentField");
const commentSubmit = document.querySelector(".commentSubmit")

const redirectDisplay = document.querySelector(".redirectDisplay");
const redirectButton = document.querySelector(".redirectButton");

// consent
consentCheckbox.onchange = () => {
    startButton.disabled = !consentCheckbox.checked;
};

// onboarding
let isIntro
const intro = introJs();

startButton.onclick = () => {
    consent.classList.add("hidden");
    experiment.classList.remove("hidden");

    isIntro = true;

    intro.setOptions({
        exitOnEsc: false, exitOnOverlayClick: false, showBullets: false, showProgress: true,

        steps: [{
            title: 'Welcome',
            intro: '<p>We aim to study the way humans use artificial intelligence (AI) to make decisions. </p>' + '<p>Your results will help us to design better AI assistants. </p>'
        }, {
            title: 'Objective',
            element: question,
            intro: '<p>You will watch an animation and decide which color has the most dots with the help of an AI.</p>'
        }, {
            title: 'Stimulus',
            element: canvasDisplay,
            intro: '<p>The animation will run 3 seconds and there are 4 dot colors.</p>'
        }, {
            title: 'AI Assistant',
            intro: '<p>The AI will watch the animation with you</p>' + '<p>However, the AI is trained on static images rather than the animation you are watching now.</p>' + '<p>Therefore, the AI can advise you but it is not always right.</p>'
        }, {
            title: 'Your Initial Answer',
            element: beforeForm,
            intro: '<p>First, give your answer. Select the color with the most dots. </p>' + '<p>Then rate your confidence between 0 and 100, where 0 means purely guessing and 100 means totally certain</p>'
        }, {
            title: 'AI\'s Answer',
            element: aiForm,
            intro: '<p>Then the AI will give you its answer and confidence</p>' + '<p>It is usually helpful, but may not always get it right</p>',
        }, {
            title: 'Your Final Answer',
            element: afterForm,
            intro: '<p>After getting the AI\'s advice, answer the question again</p>'
        }, {
            title: 'Feedback',
            intro: '<p>Get the final question right, and your score will +1.</p>' + '<p>If you are wrong, the correct answer will be shown</p>'
        }, {
            title: 'Trial',
            element: trial,
            intro: `<p>The progress will be shown on the top left. </p><p>It shows the current trial/total trials</p>`
        }, {
            title: 'Score',
            element: score,
            intro: '<p>Your score will be shown on the top right</p>' + '<p>It shows the number of questions you\'ve answered correctly/total number of questions</p>'
        }, {
            title: 'Reminder',
            intro: '<p>The AI is sometimes right and sometimes wrong.</p>' + '<p>Your objective is to learn to use the AI to maximize your score</p>'
        }, {
            title: 'Start', intro: 'Let\'s begin the experiment!',
        }]
    })

    intro.onchange((ele) => {
        if (ele === canvasDisplay) {
            canvas.classList.add("slide-in");
        }
        if (ele === beforeForm) {
            canvasDisplay.classList.add("hidden")
            questionDisplay.classList.remove("hidden")
        }

        if (ele === aiForm) {
            aiForm.classList.remove("hidden");

            document.getElementById(`ai${aiColor}`).checked = true;
            document.getElementById(`ai${aiConf}`).checked = true;
        }

        if (ele === afterForm) {
            afterForm.classList.remove("hidden");
        }
    })

    intro.oncomplete(() => {
        isIntro = false;
        resetTrial();
    })

    intro.start();
}


let curTrial = 1;
let curScore = 0;

let smpIdx
let smpData

let maxColor;
let minColors

let aiColor
let aiConf

const setData = () => {
    smpIdx = randIdx(aiData.length);
    smpData = new Map(Object.entries(aiData[smpIdx]));

    maxColor = idxClr(smpData.get("maxColor"));

    minColors = new Map(colors)
    minColors.delete(maxColor)

    repeatDots(maxDots, maxColor);
    minColors.forEach((_, clr) => repeatDots(minDots, clr))

    aiColor = idxClr(smpData.get("aiColor"));
    aiConf = Math.round(smpData.get("aiConfidence") * 10) * 10;
}

const condition = 1
const path = `data${condition}.json`

let aiData

async function getData() {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        aiData = await response.json();
    } catch (error) {
        console.error(error.message);
    }
}

getData().then(() => setData())

const allData = new Map();

trial.textContent = `Trial: 1/${numTrial} (${Math.round(1 / numTrial * 100)}%)`;
score.textContent = `Score: 0/0 (0%)`;

canvas.onanimationend = () => {
    if (!isIntro) {
        canvasDisplay.classList.add("hidden")
        questionDisplay.classList.remove("hidden")
    }
}

beforeForm.onsubmit = async event => {
    event.preventDefault();
    beforeField.disabled = true;

    if (!isIntro) {
        let beforeColor = document.querySelector('input[name="beforeColor"]:checked').value;
        smpData.set("beforeColor", beforeColor);

        let beforeConf = document.querySelector('input[name="beforeConf"]:checked').value;
        smpData.set("beforeConf", beforeConf);

        beforeSubmit.classList.add("hidden");

        aiForm.classList.remove("hidden");
        await sleep(1000);
        document.getElementById(`ai${aiColor}`).checked = true;
        await sleep(1000);
        document.getElementById(`ai${aiConf}`).checked = true;
        await sleep(1000);

        afterForm.classList.remove("hidden");
    }
}

afterForm.onsubmit = async event => {
    event.preventDefault();
    afterField.disabled = true;

    if (!isIntro) {
        let afterColor = document.querySelector('input[name="afterColor"]:checked').value;
        smpData.set("afterColor", afterColor);

        let afterConf = document.querySelector('input[name="afterConf"]:checked').value;
        smpData.set("afterConf", afterConf);

        afterSubmit.classList.add("hidden");

        let title
        let descr

        if (afterColor.toLowerCase() === maxColor.toLowerCase()) {
            curScore++
            title = "&#x2714; Correct!"
            descr = "Your score increased by 1!"
        } else {
            title = "&#x2718; Wrong!"
            descr = "The correct answer is " + maxColor
        }

        score.textContent = `Score: ${curScore}/${curTrial} (${Math.round(curScore / curTrial * 100)}%)`;
        allData.set(curTrial, smpData)

        let results = introJs()

        results.setOptions({
            exitOnEsc: false, exitOnOverlayClick: false,
            steps: [{
                title: title, intro: descr
            }]
        })

        results.oncomplete(() => {
            curTrial++
            trial.textContent = `Trial: ${curTrial}/${numTrial} (${Math.round(curTrial / numTrial * 100)}%)`;

            if (curTrial <= numTrial) {
                resetTrial()

            } else {
                experiment.classList.add("hidden");
                complete.classList.remove("hidden");
            }
        })

        results.start();
    }
}


const resetTrial = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    beforeForm.reset()
    beforeField.disabled = false;
    beforeSubmit.classList.remove("hidden");

    aiForm.reset()
    aiForm.classList.add("hidden");

    afterForm.reset()
    afterField.disabled = false;
    afterForm.classList.add("hidden");
    afterSubmit.classList.remove("hidden");

    canvasDisplay.classList.remove("hidden")
    questionDisplay.classList.add("hidden")

    setData()
}


const params = new URLSearchParams(window.location.search);
for (const [key, value] of params) {
    console.log(key, value);
}


redirectURL = "https://www.example.com"

commentSubmit.onclick = async () => {
    allData.set("comment", commentField.value);

    commentDisplay.classList.add("hidden");
    redirectDisplay.classList.remove("hidden");

    await sleep(3000);
    window.location.replace(redirectURL)
}

redirectButton.onclick = () => {
    window.location.replace(redirectURL)
}
