import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await axios.post(
      "http://localhost/backend/register.php",
      form
    );

    alert(res.data.message);

    // ✅ REDIRECT AFTER SUCCESS
    if (res.data.status === true) {
      navigate("/login");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Register</h2>

        <form onSubmit={handleSubmit}>
          <input style={styles.input} name="name" placeholder="Name" onChange={handleChange} required />
          <input style={styles.input} name="email" type="email" placeholder="Email" onChange={handleChange} required />
          <input style={styles.input} name="phone" placeholder="Phone" onChange={handleChange} required />
          <input style={styles.input} name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <button style={styles.button}>Register</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#ffb347",
  },
  card: {
    background: "#fff",
    padding: "30px",
    width: "350px",
    borderRadius: "10px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#ff7a18",
    color: "#fff",
    border: "none",
  },
};
