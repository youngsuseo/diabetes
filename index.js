const express = require('express');
const app = express();
const cors = require('cors');
const { Configuration, OpenAIApi } = require("openai");

// Load wink-nlp package.
const winkNLP = require( 'wink-nlp' );
// Load english language model.
const model = require( 'wink-eng-lite-web-model' );
// Instantiate winkNLP.
const nlp = winkNLP( model );
// Obtain "its" helper to extract item properties.
const its = nlp.its;
// Obtain "as" reducer helper to reduce a collection.
const as = nlp.as;

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
    let {userQuery} = req.body;
    let improvedQuery = extractKeywordNlp(userQuery);
    console.log(improvedQuery);

    // const completion = await openai.createChatCompletion({
    //     model: "gpt-3.5-turbo",
    //     messages: [
    //         {role: "system", content: "당신은 당뇨병 환자들을 위한 식단 조절에 대한 정보를 제공하는 전문가입니다. 사용자의 질문에 대해 관련 논문 출처를 참조하여 답변을 제공하십시오. " +
    //                 "사용자가 특정 음식에 대해 먹어도 되는지 여부를 묻는 경우, 그 음식을 먹는 것이 좋은지, 주의사항이 있는지, 대체 음식이 있는지 등의 정보를 제공해 주세요." +
    //                 "만약 사용자가 식단을 작성해 달라는 요청이 온다면 당뇨병 환자들을 위한 아침, 점심, 저녁, 간식에 대한 구체적인 음식 목록을 제공해줘." +
    //                 "건강한 식습관과 당뇨병 관리에 도움이 되는 한식 식단으로 아래와 같은 형식으로 제안해주세요 (다른 문장은 필요없이 식단 부분만 알려주세요.): " +
    //                 "아침 - 현미밥, 샐러드, 우유스무디; 점심 - 비지찌개, 무쌈, 생선구이; 저녁 - 두부조림, 가지, 소고기볶음; 간식 - 과일, 견과류."},
    //         {role: "user", content: `${improvedQuery}`},
    //     ],
    // });
    // let message = completion.data.choices[0].message;
    // console.log(message);
    // res.json(message.content);

    const meals = {
        "morning": "현미밥, 샐러드, 우유스무디",
        "lunch": "비지찌개, 무쌈, 생선구이",
        "dinner": "두부조림, 가지, 소고기볶음",
        "snack": "과일, 견과류"
    }

    res.json(meals);
});

function extractKeywordNlp(input) {
    // const doc = nlp.readDoc(input);
    // let keywords = doc.tokens().out();
    //
    // console.log(keywords);
    let keywords = input;

    if (keywords.includes("식단") || keywords.includes("추천") || keywords.includes("식사")) {
        return `'${keywords}'를 포함해서 당뇨병 환자에게 좋은 내일 식단을 구성해주세요. 다른 문장은 필요없이 식단 부분만 알려주세요.`;
    }
    return `당뇨병 환자가 '${keywords.join(" ")}' 라는 질문에 대한 답변과 질문과 관련된 논문 출처를 알려주세요.`;
}



// // 사용자 입력을 분석하여 키워드를 추출하는 함수
// function extractKeywords(input) {
//     const doc = nlp(input);
//     const nouns = doc.nouns().out("array");
//     const verbs = doc.verbs().out("array");
//
//     console.log(`nouns: ${nouns}`);
//     console.log(`verbs: ${verbs}`);
//
//     return [...nouns, ...verbs];
// }
//
// // 사용자 입력을 개선하는 함수
// function improveQuestion(input) {
//     const keywords = extractKeywords(input);
//
//     console.log(keywords);
//
//     if (keywords.contains("식단") || keywords.contains("추천") || keywords.contains("식사")) {
//         return `'${keywords.join(" ")}'를 포함해서 당뇨병 환자에게 좋은 내일 식단을 구성해주세요. 다른 문장은 필요없이 식단 부분만 알려주세요.`;
//     }
//     return `당뇨병 환자가 '${keywords.join(" ")}' 라는 질문에 대한 답변과 질문과 관련된 논문 출처를 알려주세요.`;
// }

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