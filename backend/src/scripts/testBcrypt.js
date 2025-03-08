const bcrypt = require("bcrypt")

async function testBcrypt() {
  try {
    // Senha para testar
    const password = "X9-gedz3"

    // Hash da senha atual do usuário admin (copie do banco de dados)
    const currentHash = "$2a$10$3J6RNYlcZrsuSBkr8AB/Fez.FVNNKYDjrPuAX7kEn4IQxWXDAcGiq" // Substitua pelo hash atual

    console.log("Testando bcrypt com senha e hash existente:")
    console.log(`Senha: ${password}`)
    console.log(`Hash atual: ${currentHash}`)

    // Verificar se a senha corresponde ao hash
    const match = await bcrypt.compare(password, currentHash)
    console.log(`Resultado: ${match ? "SENHA CORRETA" : "SENHA INCORRETA"}`)

    // Gerar um novo hash
    console.log("\nGerando novo hash para a mesma senha:")
    const newHash = await bcrypt.hash(password, 10)
    console.log(`Novo hash: ${newHash}`)

    // Verificar se a senha corresponde ao novo hash
    const newMatch = await bcrypt.compare(password, newHash)
    console.log(`Resultado com novo hash: ${newMatch ? "SENHA CORRETA" : "SENHA INCORRETA"}`)

    // Testar com uma senha diferente
    const wrongPassword = "wrongpassword"
    console.log(`\nTestando com senha incorreta: ${wrongPassword}`)
    const wrongMatch = await bcrypt.compare(wrongPassword, newHash)
    console.log(`Resultado: ${wrongMatch ? "SENHA CORRETA" : "SENHA INCORRETA"}`)
  } catch (error) {
    console.error("Erro:", error)
  }
}

testBcrypt()

