
fetch("http://localhost:3000/api/launch-map/strategy-chat", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Cookie": "next-auth.session-token=..." },
  body: JSON.stringify({ brandId: "test", messages: [{role: "user", content: "__INIT__"}] })
}).then(r=>r.json()).then(console.log);

