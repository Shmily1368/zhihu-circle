const resultData = {
  center: { uid: 1, fullname: "User", headline: "Developer" },
  users: [
    { uid: 2, fullname: "Friend 1", score: 80, circle: 1, recent_moments: [{ action_text: "回答了问题", target: { title: "What is Next.js?" } }] }
  ],
  circles: {
    circle1: [{ uid: 2, fullname: "Friend 1", score: 80, circle: 1, recent_moments: [{ action_text: "回答了问题", target: { title: "What is Next.js?" } }] }],
    circle2: [],
    circle3: []
  },
  globalInsights: { topActiveUsers: [] }
};

fetch('http://localhost:3000/api/circle/insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(resultData)
}).then(res => res.json()).then(console.log).catch(console.error);
