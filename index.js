const express = require('express');
const app = express();
const cors = require('cors');
const { Configuration, OpenAIApi } = require("openai");

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
    let { userMessages, assistantMessages } = req.body

    let messages = [
        {
            role: "system",
            content: "당신은 당뇨병 환자들을 위한 식단 조절에 대한 정보를 제공하는 전문가입니다. 사용자의 질문에 대해 관련 논문 출처를 함께 첨부하여 답변을 제공하십시오. " +
                "사용자가 특정 음식에 대해 먹어도 되는지 여부를 묻는 경우, 그 음식을 먹는 것이 좋은지, 주의사항이 있는지, 대체 음식이 있는지 등의 정보를 제공해 주세요." +
                "HTML 태그를 사용하여 답변을 해주세요." +
                `예를 들어, <p>이 음식은 먹어도 되지만, <b>과도한 섭취는 주의해야 합니다.</b></p>`
        }
    ];

    while (!!userMessages && userMessages.length !== 0 || !!assistantMessages && assistantMessages.length !== 0) {
        if (!!userMessages &&userMessages.length !== 0) {
            messages.push(
                JSON.parse('{"role": "user", "content": "' + String(userMessages.shift()).replace(/\n/g,"") + '"}')
            )
        }
        if (!!assistantMessages && assistantMessages.length !== 0) {
            messages.push(
                JSON.parse('{"role": "assistant", "content": "' + String(assistantMessages.shift()).replace(/\n/g,"") + '"}')
            )
        }
    }

    const maxRetries = 3;
    let retries = 0;
    let completion
    while (retries < maxRetries) {
        try {
            completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: messages,
            });
            break;
        } catch (e) {
            retries++;
            console.log(e);
            console.log(`Retrying... ${retries} / ${maxRetries}`);
        }
    }

    let content = completion.data.choices[0].message['content'];
    res.json(content);
});

// 식단 추천 api
app.post('/meals', async function (req, res) {
    let { chatMessage } = req.body;
    console.log(`chatMessage: ${chatMessage}`);

    let todayDateTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            // FIXME prompt 수요
            {role: "system", content: "당신은 당뇨병 환자들을 위한 아침, 점심, 저녁에 대한 구체적인 음식 목록을 제공하는 전문가입니다. " +
                    `건강한 식습관과 당뇨병 관리에 도움이 되는 한식 식단을 제안해주세요. 그리고 오늘은 ${todayDateTime} 입니다.` +
                    "또한, 섭취 양 (g) 수와 칼로리 (kcal) 값을 함께 전달해주세요. " +
                    `${chatMessage} 의 글을 기반으로 당뇨병 환자에게 좋은 식단을 오늘, 내일 이틀치만 구성해주세요. `+
                    "예를 들어, JSON 형식으로 아래와 같이 제공해주세요. 다른 문장은 필요없이 JSON 부분만 알려주세요. " +
                    "[\n" +
                    " {\n" +
                    "   \"title\": \"오트밀 (50g, 150kcal), 바나나 (30g, 130kcal), 요거트 (25g, 200kcal)\",\n" +
                    "   \"start\": \"2023-04-21T07:30:00\",\n" +
                    "   \"end\": \"2023-04-21T08:00:00\"\n" +
                    " },\n" +
                    " {\n" +
                    "   \"title\": \"비지찌개 (400g, 550kcal), 무쌈 (30g, 70kcal), 생선구이 (70g, 250kcal)\",\n" +
                    "   \"start\": \"2023-04-21T12:00:00\",\n" +
                    "   \"end\": \"2023-04-21T13:30:00\"\n" +
                    " },\n" +
                    " {\n" +
                    "   \"title\": \"비지찌개 (400g, 550kcal), 무쌈 (30g, 70kcal), 생선구이 (70g, 250kcal)\",\n" +
                    "   \"start\": \"2023-04-21T18:00:00\",\n" +
                    "   \"end\": \"2023-04-21T19:00:00\"\n" +
                    " }\n" +
                    "]"},
            {role: "user", content: "다른 문장은 필요없이 JSON 데이터만 알려주세요."}
        ],
    });
    let content = completion.data.choices[0].message.content;
    console.log(content);
    res.json(content);
});

app.listen(3000);