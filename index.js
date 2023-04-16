const express = require('express')
const app = express()
const { Configuration, OpenAIApi } = require("openai");
const nlp = require("compromise");

const configuration = new Configuration({
    apiKey: API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', function (req, res) {
    res.send('Hello World')
})

app.post('/foods', async function (req, res) {
    let {userQuery} = req.body;

    let improvedQuery = improveQuestion(userQuery);

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {role: "system", content: "당신은 당뇨병 환자들을 위한 식단 조절에 대한 정보를 제공하는 전문가입니다. 사용자의 질문에 대해 관련 논문 출처를 참조하여 답변을 제공하십시오. 사용자가 특정 음식에 대해 먹어도 되는지 여부를 묻는 경우, 그 음식을 먹는 것이 좋은지, 주의사항이 있는지, 대체 음식이 있는지 등의 정보를 제공해 주세요."},
            {role: "user", content: improvedQuery}
        ],
    });
    let message = completion.data.choices[0].message;
    console.log(message);
    res.send(message.content);
})

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
    const improvedQuestion = `당뇨병 환자가 '${keywords.join(" ")}' 라는 질문에 대한 답변과 질문과 관련된 논문 출처를 알려주세요.`;
    console.log(improvedQuestion);

    return improvedQuestion;
}

app.listen(3000)