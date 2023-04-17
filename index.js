const express = require('express');
const app = express();
const cors = require('cors');
const { Configuration, OpenAIApi } = require("openai");
const nlp = require("compromise");

const configuration = new Configuration({
    apiKey: API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', function (req, res) {
    res.send('Hello World')
});

app.post('/foods', async function (req, res) {

    let {gender, age, weight, bloodSugar, userQuery} = req.body;

    console.log(`gender: ${gender}, age: ${age}, weight: ${weight}, bloodSugar: ${bloodSugar}, userQuery: ${userQuery}`);

    let improvedQuery = improveQuestion(userQuery);

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {role: "system", content: "당신은 당뇨병 환자들을 위한 식단 조절에 대한 정보를 제공하는 전문가입니다. 사용자의 질문에 대해 관련 논문 출처를 참조하여 답변을 제공하십시오. " +
                    "사용자가 특정 음식에 대해 먹어도 되는지 여부를 묻는 경우, 그 음식을 먹는 것이 좋은지, 주의사항이 있는지, 대체 음식이 있는지 등의 정보를 제공해 주세요."},
            {role: "user", content: `저의 몸무게는 ${improvedQuery}이고, 나이는 ${age}살이고, 혈당은 ${bloodSugar}입니다. 그리고 몸무게는 ${weight}kg입니다.
                    ${userQuery}`},
        ],
    });
    let message = completion.data.choices[0].message;
    console.log(message);
    res.json(message.content);
});

// 사용자 입력을 분석하여 키워드를 추출하는 함수
function extractKeywords(input) {
    const doc = nlp(input);
    const nouns = doc.nouns().out("array");
    const verbs = doc.verbs().out("array");

    return [...nouns, ...verbs];
}

// 사용자 입력을 개선하는 함수
function improveQuestion(input) {
    const keywords = extractKeywords(input);
    // 키워드를 사용하여 더 구체적인 질문을 생성합니다.
    return `당뇨병 환자가 '${keywords.join(" ")}' 라는 질문에 대한 답변과 질문과 관련된 논문 출처를 알려주세요.`;
}

// 식단 추천 api
app.get('/meals', async function (req, res) {
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {role: "system", content: "당신은 당뇨병 환자들을 위한 아침, 점심, 저녁, 간식에 대한 구체적인 음식 목록을 제공하는 전문가입니다. " +
                    "건강한 식습관과 당뇨병 관리에 도움이 되는 한식 식단으로 아래와 같은 형식으로 제안해주세요: " +
                    "아침 - 현미밥, 샐러드, 우유스무디; 점심 - 비지찌개, 무쌈, 생선구이; 저녁 - 두부조림, 가지, 소고기볶음; 간식 - 과일, 견과류."},
            {role: "user", content: "당뇨병 환자에게 좋은 내일 식단을 구성해주세요. 다른 문장은 필요없이 식단 부분만 알려주세요."}
        ],
    });
    let message = completion.data.choices[0].message;
    res.json(message.content);
});

app.listen(3000);