import React, { useState } from "react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await axios.post(
      "http://localhost/backend/login.php",
      { email, password }
    );

    alert(res.data.message);

    if (res.data.status === true) {
      // later you can redirect to dashboard
      console.log("User Data:", res.data.user);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button style={styles.button}>Login</button>
        </form>
      </div>
    </div>
  );
}

/* CSS INSIDE JSX */
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#ff7a18,#ffb347)",
  },
  card: {
    background: "#fff",
    padding: "30px",
    width: "320px",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#ff7a18",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
