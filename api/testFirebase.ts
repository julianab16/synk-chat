import { db } from "./firebase";

async function runTest() {
  try {
    const ref = db.collection("test").doc("prueba");
    
    await ref.set({
      mensaje: "Funciona Firebase Admin!",
      timestamp: new Date()
    });

    console.log("🔥 Firebase Admin funciona correctamente");
  } catch (error) {
    console.error("❌ Error probando Firebase:", error);
  }
}

runTest();
