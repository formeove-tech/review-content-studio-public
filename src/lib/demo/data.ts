// 데모 사이트용 가상 리뷰 — 처음부터 만든 가짜 가게·가짜 손님·가짜 문장입니다 (실제 매장·손님과 무관)
export const DEMO_STORE = {
  storeName: "가상국밥집",
  brandName: "",
  region: "가상시 가상동",
  signatureMenus: "얼큰국밥, 순대국밥, 수육",
  tone: "따뜻하고 담백한 사장님 말투, 과장 없이",
  instagramHandle: "",
  naverPlaceUrl: "",
  baeminReviewUrl: "",
  coupangReviewUrl: "",
  extraNotes: "이 가게는 데모용 가상 가게입니다.",
};

export interface DemoReview {
  p: "baemin" | "coupangeats" | "naver";
  ago: number; // 며칠 전
  name: string;
  rating: number;
  text: string;
  menu?: string;
  delivery?: "좋아요" | "아쉬워요";
  photos?: number[]; // photo-N.jpg 번호
  orders?: number;
  reply?: string;
}

export const DEMO_REVIEWS: DemoReview[] = [
  { p: "baemin", ago: 0, name: "김*수", rating: 5, text: "국물이 진하고 얼큰해서 해장에 딱이었어요. 고기도 푸짐하게 들어 있어서 한 그릇 먹고 나니 배가 든든합니다.", menu: "얼큰국밥(대)", delivery: "좋아요", photos: [1], orders: 3 },
  { p: "baemin", ago: 0, name: "이*진", rating: 5, text: "배달 시간 정확하고 도착했을 때도 국물이 팔팔 끓고 있었어요. 포장도 깔끔해서 하나도 안 샜습니다.", menu: "순대국밥", delivery: "좋아요", photos: [3] },
  { p: "baemin", ago: 1, name: "박*영", rating: 5, text: "야근하고 늦게 시켜 먹었는데 눈물 날 뻔했어요. 엄마가 끓여준 것 같은 따뜻한 맛이에요. 감사합니다.", menu: "수육국밥", delivery: "좋아요", photos: [4], orders: 2 },
  { p: "baemin", ago: 1, name: "최*호", rating: 5, text: "양이 정말 많아요 ㅋㅋ 밥 말고 먹으려고 했는데 결국 다 말아서 먹었네요. 가격 대비 최고예요!!", menu: "얼큰국밥(특)", delivery: "좋아요", photos: [5] },
  { p: "baemin", ago: 2, name: "정*아", rating: 5, text: "벌써 세 번째 시켜 먹어요. 단골 됐습니다. 깍두기도 맛있고 밑반찬이 항상 넉넉해서 좋아요.", menu: "순대국밥", delivery: "좋아요", orders: 3 },
  { p: "baemin", ago: 2, name: "한*준", rating: 4, text: "맛은 정말 좋은데 국물이 조금 식어서 도착했어요. 그래도 한 번 데워 먹으니 괜찮았습니다. 맛은 인정!", menu: "얼큰국밥(대)", delivery: "아쉬워요", photos: [2] },
  { p: "baemin", ago: 3, name: "윤*서", rating: 5, text: "국물 한 숟갈 뜨자마자 속이 풀리는 느낌이에요. 칼칼한데 자극적이지 않아서 끝까지 맛있게 먹었어요.", menu: "얼큰국밥(중)", delivery: "좋아요", photos: [7] },
  { p: "baemin", ago: 3, name: "강*민", rating: 5, text: "사장님이 요청사항을 꼼꼼히 챙겨주셔서 감동했어요. 파 빼달라고 했는데 정확히 빼서 오셨어요.", menu: "곰탕", delivery: "좋아요" },
  { p: "baemin", ago: 4, name: "조*은", rating: 5, text: "수육이 부드럽고 냄새가 하나도 안 나요. 새우젓이랑 같이 먹으니 술이 술술 들어갑니다 ㅎㅎ", menu: "수육(중)", delivery: "좋아요", photos: [8] },
  { p: "baemin", ago: 5, name: "서*연", rating: 5, text: "비 오는 날 생각나서 시켰는데 역시 믿고 먹는 집이에요. 국물이 깊고 뜨끈해서 몸이 사르르 녹았어요.", menu: "순대국밥", delivery: "좋아요", photos: [6], orders: 4 },
  { p: "baemin", ago: 5, name: "오*석", rating: 3, text: "맛은 괜찮은데 포장이 조금 아쉬웠어요. 비닐이 약해서 국물이 살짝 샜습니다. 다음엔 괜찮길 바랍니다.", menu: "얼큰국밥(대)", delivery: "아쉬워요" },
  { p: "baemin", ago: 6, name: "임*희", rating: 5, text: "아이랑 같이 먹었는데 맵지 않은 국밥이라 잘 먹었어요. 고기가 많아서 아이가 너무 좋아했습니다.", menu: "곰탕", delivery: "좋아요", photos: [8] },
  { p: "baemin", ago: 7, name: "홍*기", rating: 5, text: "점심시간에 시켰는데 15분 만에 왔어요. 바빠도 이렇게 빨리 오다니 놀랐습니다. 맛도 변함없이 좋아요.", menu: "순대국밥", delivery: "좋아요" },
  { p: "baemin", ago: 8, name: "문*정", rating: 5, text: "속이 안 좋은 날 먹었는데 국물이 담백해서 부담 없이 먹었어요. 건더기도 푸짐합니다.", menu: "곰탕", delivery: "좋아요", photos: [3] },
  { p: "baemin", ago: 10, name: "신*우", rating: 5, text: "순대가 직접 만든 것처럼 속이 꽉 차 있어요. 비린내도 없고 쫄깃해서 계속 생각나요.", menu: "순대 한접시", delivery: "좋아요", photos: [6] },
  { p: "baemin", ago: 12, name: "권*라", rating: 2, text: "배달이 한 시간 넘게 걸렸어요. 도착했을 때는 이미 식어 있었습니다. 맛 이전에 배달이 너무 늦어서 아쉬워요.", menu: "얼큰국밥(대)", delivery: "아쉬워요" },
  { p: "baemin", ago: 14, name: "송*현", rating: 5, text: "회식 다음 날 해장하려고 시켰는데 대성공이에요. 얼큰한 국물에 밥 말아 먹으니 속이 확 풀렸습니다!", menu: "얼큰국밥(특)", delivery: "좋아요", photos: [1] },
  { p: "baemin", ago: 16, name: "남*주", rating: 5, text: "가격이 착한데 양은 푸짐해서 놀랐어요. 이 가격에 이 정도면 자주 시켜 먹을 수밖에 없겠어요.", menu: "순대국밥", delivery: "좋아요" },
  { p: "baemin", ago: 20, name: "유*림", rating: 5, text: "식당에서 먹는 것처럼 뜨끈하게 와서 좋았어요. 국물 맛이 한결같아서 안심이 됩니다.", menu: "곰탕", delivery: "좋아요", photos: [4] },
  { p: "baemin", ago: 24, name: "배*환", rating: 4, text: "고기가 부드럽고 국물이 시원해요. 다만 반찬이 조금 더 있었으면 좋겠어요. 그래도 만족합니다.", menu: "수육국밥", delivery: "좋아요" },
  { p: "baemin", ago: 29, name: "황*아", rating: 5, text: "처음 시켜봤는데 왜 이제 알았나 싶어요. 얼큰하고 깊은 맛이 제 입맛에 딱입니다.", menu: "얼큰국밥(중)", delivery: "좋아요", photos: [5] },
  { p: "baemin", ago: 33, name: "노*훈", rating: 5, text: "엄마 생신 때 수육이랑 국밥 시켜드렸는데 너무 좋아하셨어요. 정성이 느껴지는 맛이라고 하셨습니다.", menu: "수육(대)", delivery: "좋아요", photos: [8] },
  { p: "baemin", ago: 41, name: "안*미", rating: 5, text: "아침 일찍 해장하려고 시켰는데 일등으로 도착했어요. 국물이 아직도 끓고 있었습니다.", menu: "얼큰국밥(대)", delivery: "좋아요" },
  { p: "coupangeats", ago: 0, name: "백*주", rating: 5, text: "깔끔하고 진한 국물이 일품이에요. 포장 용기도 튼튼해서 한 방울도 안 샜어요.", menu: "순대국밥", photos: [2] },
  { p: "coupangeats", ago: 2, name: "구*철", rating: 5, text: "양도 많고 맛도 좋아요. 가족끼리 나눠 먹었는데 다들 맛있다고 했어요. 재주문 의사 100%입니다.", menu: "얼큰국밥(특)", photos: [7], orders: 2 },
  { p: "coupangeats", ago: 4, name: "마*아", rating: 4, text: "국물이 진하고 고기도 부드러웠어요. 조금 짠 편이라 밥을 말아 먹으니 딱 좋았습니다.", menu: "곰탕" },
  { p: "coupangeats", ago: 6, name: "탁*우", rating: 5, text: "퇴근하고 지친 몸으로 먹었는데 뜨끈한 국물에 힘이 났어요. 오늘 하루 고생 많았다고 위로받는 기분이었어요.", menu: "순대국밥", photos: [3] },
  { p: "coupangeats", ago: 9, name: "차*은", rating: 5, text: "수육 질이 정말 좋아요. 잡내 없이 부드럽고 양도 푸짐해서 둘이 먹기 충분했어요.", menu: "수육(중)", photos: [6] },
  { p: "coupangeats", ago: 13, name: "추*영", rating: 3, text: "맛은 좋은데 매운맛이 생각보다 강해서 조금 힘들었어요. 맵기 조절이 가능하면 좋겠습니다.", menu: "얼큰국밥(대)" },
  { p: "coupangeats", ago: 18, name: "표*빈", rating: 5, text: "점심 특가로 시켰는데 양이 줄지 않아서 좋았어요. 국물 맛도 그대로고 만족합니다.", menu: "순대국밥", photos: [1] },
  { p: "coupangeats", ago: 25, name: "하*진", rating: 5, text: "속이 편한 국밥이에요. 간이 세지 않아서 아이도 어른도 부담 없이 먹을 수 있어요.", menu: "곰탕", photos: [4] },
  { p: "naver", ago: 1, name: "도*현", rating: 5, text: "가게에 직접 가서 먹었는데 배달보다 훨씬 맛있어요. 직원분도 친절하시고 깍두기 리필도 바로 해주셨어요.", photos: [5] },
  { p: "naver", ago: 5, name: "봉*아", rating: 5, text: "혼밥하기 좋은 분위기예요. 자리가 깔끔하고 국밥이 금방 나와서 점심시간에 딱입니다.", photos: [2] },
  { p: "naver", ago: 8, name: "계*수", rating: 5, text: "순대국밥 국물이 진짜 깊어요. 한 그릇 비우고 나오니 든든합니다. 주차도 편해서 자주 올 것 같아요." },
  { p: "naver", ago: 15, name: "소*라", rating: 4, text: "회식하기 좋아요. 단체 자리도 넉넉하고 수육이랑 국밥 같이 시키면 푸짐합니다. 다만 저녁에는 대기가 있었어요." },
  { p: "naver", ago: 22, name: "방*우", rating: 5, text: "부모님 모시고 갔는데 어르신들이 먹기 편한 담백한 국물이라고 좋아하셨어요. 사장님이 친절하세요.", photos: [7] },
  { p: "naver", ago: 30, name: "석*희", rating: 5, text: "국밥집은 이제 여기로 정착이에요. 맛도 양도 서비스도 뭐 하나 빠지는 게 없어요!!", photos: [3] },
  { p: "baemin", ago: 3, name: "노*아", rating: 5, text: "", menu: "순대국밥", delivery: "좋아요" },
  { p: "baemin", ago: 9, name: "라*희", rating: 5, text: "", menu: "곰탕", delivery: "좋아요" },
];
