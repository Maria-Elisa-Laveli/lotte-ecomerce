// ====================
// 📦 IMPORTAÇÕES
// ====================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();
// ====== GOOGLE GENERATIVE AI ======
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("🔑 API Key carregada:", process.env.GEMINI_API_KEY ? "SIM ✅" : "NÃO ❌");


// ====================
// 🛠️ INICIALIZAÇÃO DO APP
// ====================
const app = express();

app.use(cors({
 origin: ["https://lotte-ecomerce.onrender.com", "http://localhost:3000"],

  credentials: true
}));

app.use(cookieParser());
app.use(bodyParser.json());
app.use("/public", express.static(path.join(__dirname, "bancos/public")));
app.use("/", express.static(path.join(__dirname)));

// ====================
// 🔗 CONEXÃO COM MONGODB
// ====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado ao MongoDB com sucesso!"))
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err));

// ====================
// 👤 SCHEMA DE USUÁRIOS
// ====================
const userSchema = new mongoose.Schema({
  nome: String,
  fotoPerfil: { type: String, default: "/img/default-avatar.png" },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  telefone: String,
  sexo: String,
  data: String,
  cidade: String,
  estado: String,
  endereco: String,
  senha: { type: String, required: true },
  resetToken: String,
  resetTokenExpiration: Date,
  
  favoritos: [{ type: mongoose.Schema.Types.ObjectId, ref: "products" }],

   carrinho: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
    quantity: { type: Number, default: 1 }
  }]


});



const User = mongoose.model("users", userSchema);

// ====================
// 🧾 SCHEMA DE PRODUTOS
// ====================
const productSchema = new mongoose.Schema({
  name: String,
  brand: String,
  price: Number,
  stock: Number,
  volume: String,
  category: String,
  description: String,
  image: String,
  isPublished: { type: Boolean, default: false } // Adicionar
});


const Product = mongoose.model("products", productSchema);



// ====================
// 🧍 ROTAS DE CONTA
// ====================

// Cadastro
app.post("/cadastro", async (req, res) => {
  try {
    const { nome, username, email, telefone, sexo, data, cidade, estado, endereco, senha } = req.body;

    const usuarioExistente = await User.findOne({ $or: [{ email }, { username }] });
    if (usuarioExistente) {
      return res.status(400).json({ error: "E-mail ou nome de usuário já cadastrados!" });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const novoUsuario = new User({
      nome,
      username,
      email,
      telefone,
      sexo,
      data,
      cidade,
      estado,
      endereco,
      senha: hashedPassword
    });

    await novoUsuario.save();
    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.status(500).json({ error: "Erro ao cadastrar usuário" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const usuario = await User.findOne({ email });
  if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  if (!senhaCorreta) return res.status(401).json({ error: "Senha incorreta." });

  const token = jwt.sign(
    { email: usuario.email, username: usuario.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  secure: process.env.NODE_ENV === "production" // true no Render
});

  res.json({ message: "Login bem-sucedido!" });
});

// Recuperar senha
app.post("/recuperar", async (req, res) => {
  const { email } = req.body;

  const usuario = await User.findOne({ email });
  if (!usuario) return res.status(404).json({ error: "E-mail não encontrado." });

  const token = crypto.randomBytes(32).toString("hex");
  usuario.resetToken = token;
  usuario.resetTokenExpiration = Date.now() + 3600000;
  await usuario.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

 const resetLink = `https://lotte-ecomerce.onrender.com/resetar.html?token=${token}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Redefinição de senha",
      html: `<p>Clique no link abaixo para redefinir sua senha:</p><a href="${resetLink}">${resetLink}</a>`
    });

    res.json({ message: "Link de redefinição enviado ao e-mail." });
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    res.status(500).json({ error: "Erro ao enviar e-mail: " + error.message });
  }
});

// Resetar senha
app.post("/resetar", async (req, res) => {
  const { token, novaSenha } = req.body;

  const usuario = await User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }
  });

  if (!usuario) return res.status(400).json({ error: "Token inválido ou expirado." });

  usuario.senha = await bcrypt.hash(novaSenha, 10);
  usuario.resetToken = undefined;
  usuario.resetTokenExpiration = undefined;

  await usuario.save();
  res.json({ message: "Senha redefinida com sucesso!" });
});

// ====================
// 🛍️ ROTAS DE PRODUTOS (ADMIN)
// ====================

app.post("/api/products", async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json({ message: "Produto adicionado com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao adicionar produto:", error);
    res.status(500).json({ error: "Erro ao adicionar produto." });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("❌ Erro ao buscar produtos:", error);
    res.status(500).json({ error: "Erro ao buscar produtos." });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Produto não encontrado." });
    res.json(product);
  } catch (error) {
    console.error("❌ Erro ao buscar produto:", error);
    res.status(500).json({ error: "Erro ao buscar produto." });
  }
});

// Alterar status de publicação de um produto
app.put("/api/products/:id/publish", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Produto não encontrado." });

    // Alterna o valor de isPublished
    product.isPublished = !product.isPublished;
    await product.save();

    res.json({ message: "Status de publicação alterado com sucesso!", isPublished: product.isPublished });
  } catch (error) {
    console.error("Erro ao alterar status de publicação:", error);
    res.status(500).json({ error: "Erro ao alterar status de publicação." });
  }
});


app.delete("/api/products/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ error: "Produto não encontrado." });
    res.status(200).json({ message: "Produto excluído com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao excluir produto:", error);
    res.status(500).json({ error: "Erro ao excluir produto." });
  }
});

app.post("/favoritos/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user.favoritos.includes(req.params.id)) {
      user.favoritos.push(req.params.id);
      await user.save();
    }

    res.json({ message: "Favorito adicionado." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao adicionar favorito." });
  }
});

app.delete("/favoritos/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    user.favoritos = user.favoritos.filter(f => f.toString() !== req.params.id);
    await user.save();

    res.json({ message: "Favorito removido." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover favorito." });
  }
});
app.get("/favoritos", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email })
      .populate("favoritos");

    res.json(user.favoritos);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar favoritos." });
  }
});



// ====================
// 🚀 INICIAR SERVIDOR
// ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
);

// ====================
// 🔐 MIDDLEWARE AUTH
// ====================
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Não autenticado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// Perfil
app.get("/perfil", authMiddleware, async (req, res) => {
  try {
    const usuario = await User.findOne({ email: req.user.email })
      .select("-senha -resetToken -resetTokenExpiration");

    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado" });

    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar perfil" });
  }
});




// ====================
// 📄 Buscar dados do usuário
// ====================
app.get("/api/usuario", authMiddleware, async (req, res) => {
  try {
    const usuario = await User.findOne({ email: req.user.email })
      .select("-senha -resetToken -resetTokenExpiration");

    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });

    res.json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

// ====================
// 🔐 Verificar autenticação
// ====================
app.get("/checkAuth", (req, res) => {
  const token = req.cookies.token;

  if (!token) return res.json({ autenticado: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ autenticado: true, user: decoded });
  } catch {
    res.json({ autenticado: false });
  }
});

// ====================
// 🔓 Logout
// ====================
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logout realizado com sucesso" });
});



app.put("/atualizar-perfil", authMiddleware, async (req, res) => {
  try {
    const { nome, username, email, telefone, cidade, estado, endereco, sexo, data, senha } = req.body;

    let novosDados = { nome, username, email, telefone, cidade, estado, endereco, sexo, data };

    // Se a senha foi enviada, criptografa
    if (senha && senha.trim() !== "") {
      const senhaHash = await bcrypt.hash(senha, 10);
      novosDados.senha = senhaHash;
    }

    // Atualiza usando o email vindo do token
    const usuarioAtualizado = await User.findOneAndUpdate(
      { email: req.user.email },
      novosDados,
      { new: true }
    );

    if (!usuarioAtualizado) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json({ message: "Perfil atualizado com sucesso!", usuario: usuarioAtualizado });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ error: "Erro ao atualizar o perfil." });
  }
});

// Adicionar produto ao carrinho
app.post("/carrinho/add/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    const productId = req.params.id;

    const existing = user.carrinho.find(item => item.product.toString() === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      user.carrinho.push({ product: productId, quantity: 1 });
    }

    await user.save();
    res.json({ message: "Produto adicionado ao carrinho!" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao adicionar produto ao carrinho." });
  }
});

// Buscar produtos do carrinho
app.get("/carrinho", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).populate("carrinho.product");
    res.json(user.carrinho);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar carrinho." });
  }
});

// Atualizar quantidade do carrinho
app.put("/carrinho/update/:id", authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const user = await User.findOne({ email: req.user.email });
    const item = user.carrinho.find(i => i.product.toString() === req.params.id);
    if (item) {
      item.quantity = quantity;
      await user.save();
      res.json({ message: "Quantidade atualizada!" });
    } else {
      res.status(404).json({ error: "Produto não encontrado no carrinho." });
    }
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar carrinho." });
  }
});

// Remover produto do carrinho
app.delete("/carrinho/remove/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    user.carrinho = user.carrinho.filter(i => i.product.toString() !== req.params.id);
    await user.save();
    res.json({ message: "Produto removido do carrinho." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover produto." });
  }
});

app.post("/api/cronograma", async (req, res) => {
  try {
    const respostas = req.body.respostas;

    const prompt = `
      Você é um especialista em cuidados capilares. 
      Com base nas respostas abaixo, monte um CRONOGRAMA CAPILAR de 4 semanas, em formato de TABELA HTML.
      Não use asteriscos (*). Evite textos longos, e deixe a resposta bem organizada e visual.
      Use tons suaves e títulos claros na tabela.

      Respostas:
      - Tipo de cabelo: ${respostas.tipo}
      - Principal necessidade: ${respostas.necessidade}
      - Possui química: ${respostas.quimica}
      - Frequência de lavagem: ${respostas.lavagem}
      - Objetivo do tratamento: ${respostas.objetivo}

      A tabela deve conter:
      - Colunas: Semana | Segunda | Quarta | Sexta | Domingo
      - Cada célula com o tipo de tratamento (Hidratação, Nutrição, Reconstrução)
      - Uma breve legenda abaixo da tabela explicando o foco de cada tipo.
      Responda apenas com HTML formatado.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const html = response.text();

    res.json({ cronograma: html });
  } catch (error) {
    console.error("Erro ao gerar cronograma:", error);
    res.status(500).json({ error: "Falha ao gerar cronograma" });
  }
});
