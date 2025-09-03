const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const schedule = require("node-schedule");
const dayjs = require("dayjs");

const app = express();
app.use(cors());
app.use(express.json());

const groupId = "120363162959778625@g.us";
let qrCodeData = null;
let isReady = false;
let client;
let targetNumber = "6285147236609@c.us"; // Nomor yang akan di-tag
let isDisconnected = false;
let isAuthenticated = false;
let isLoading = false;

function startWhatsApp() {
  console.log("Starting WhatsApp client...");

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qr) => {
    console.log("QR code received, generating data URL...");
    qrcode.toDataURL(qr, (err, url) => {
      if (err) {
        console.error("Error generating QR code:", err);
        return;
      }
      qrCodeData = url;
      isReady = false;
      isDisconnected = false;
      console.log("QR code generated successfully");
    });
  });

  client.on("ready", () => {
    console.log("WhatsApp ready event triggered");
    
    // Set status ready terlebih dahulu
    isReady = true;
    isAuthenticated = true;
    isLoading = false;
    isDisconnected = false;
    qrCodeData = null;
    console.log("WhatsApp connected successfully!");

    // Test getChats dengan delay untuk memastikan benar-benar ready
    setTimeout(() => {
      client
        .getChats()
        .then((chats) => {
          console.log("✅ WhatsApp fully ready! Found", chats.length, "chats");
        })
        .catch((error) => {
          console.log("⚠️ getChats test failed:", error.message);
          console.log("Retrying in 5 seconds...");
          
          // Retry setelah 5 detik
          setTimeout(() => {
            client
              .getChats()
              .then((chats) => {
                console.log("✅ WhatsApp fully ready after retry! Found", chats.length, "chats");
              })
              .catch((retryError) => {
                console.log("❌ getChats still failing:", retryError.message);
                // Reset ready status if still failing
                isReady = false;
              });
          }, 5000);
        });
    }, 3000); // Test setelah 3 detik
  });

  client.on("authenticated", () => {
    console.log("WhatsApp authenticated");
    isAuthenticated = true;
    
    // Jangan langsung set ready di sini, biarkan event 'ready' yang handle
    console.log("Waiting for ready event...");
    
    // Fallback timeout jika ready event tidak pernah dipanggil
    setTimeout(() => {
      if (!isReady && isAuthenticated) {
        console.log("🔄 Ready event still not triggered after 30 seconds, trying force ready...");
        
        client.getChats().then((chats) => {
          console.log("✅ Force ready from authenticated successful! Found", chats.length, "chats");
          isReady = true;
          isLoading = false;
          qrCodeData = null;
          console.log("🚀 WhatsApp forced to ready state from authenticated event!");
        }).catch((error) => {
          console.log("❌ Force ready from authenticated failed:", error.message);
        });
      }
    }, 30000); // 30 detik setelah authenticated
  });

  client.on("auth_failure", () => {
    console.log("WhatsApp authentication failed");
    isReady = false;
    isAuthenticated = false;
    isDisconnected = true;
    clearSession();
  });

  client.on("disconnected", (reason) => {
    console.log("WhatsApp disconnected:", reason);
    isReady = false;
    isAuthenticated = false;
    isDisconnected = true;
    qrCodeData = null;

    // Hapus session untuk force regenerate QR
    clearSession();
  });

  client.on("loading_screen", (percent, message) => {
    console.log("Loading screen:", percent, message);
    isLoading = true;
    
    if (percent === 100) {
      console.log("Loading complete, waiting for ready event...");
      
      // Fallback: Jika ready event tidak dipanggil dalam 10 detik, force ready
      setTimeout(() => {
        if (!isReady && isAuthenticated) {
          console.log("🔄 Ready event not triggered, trying to force ready...");
          
          // Test apakah client bisa melakukan operasi dasar
          client.getChats().then((chats) => {
            console.log("✅ Force ready successful! Found", chats.length, "chats");
            isReady = true;
            isLoading = false;
            qrCodeData = null;
            console.log("🚀 WhatsApp forced to ready state after loading complete!");
          }).catch((error) => {
            console.log("❌ Force ready failed:", error.message);
            console.log("Will retry in 5 seconds...");
            
            // Retry setelah 5 detik
            setTimeout(() => {
              client.getChats().then((chats) => {
                console.log("✅ Force ready retry successful! Found", chats.length, "chats");
                isReady = true;
                isLoading = false;
                qrCodeData = null;
                console.log("🚀 WhatsApp forced to ready state after retry!");
              }).catch((retryError) => {
                console.log("❌ Force ready retry still failed:", retryError.message);
              });
            }, 5000);
          });
        }
      }, 10000); // 10 detik setelah loading 100%
    }
  });

  client.on("change_state", (state) => {
    console.log("WhatsApp state changed:", state);
    // Jangan set ready di sini, biarkan event 'ready' yang handle
  });

  client.initialize();
}

function clearSession() {
  try {
    const sessionPath = path.join(__dirname, ".wwebjs_auth");
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log("Session cleared");
    }
  } catch (error) {
    console.error("Error clearing session:", error);
  }
}

app.get("/wa/qr", (req, res) => {
  console.log(
    "QR endpoint called. QR available:",
    !!qrCodeData,
    "Ready:",
    isReady,
    "Disconnected:",
    isDisconnected
  );

  if (qrCodeData) {
    res.json({ qr: qrCodeData });
  } else if (isReady) {
    res.json({ error: "Already connected to WhatsApp", ready: true });
  } else {
    res.status(404).json({
      error: "QR not available yet.",
      ready: isReady,
      disconnected: isDisconnected,
    });
  }
});

app.get("/wa/status", (req, res) => {
  res.json({
    ready: isReady,
    authenticated: isAuthenticated,
    loading: isLoading,
    disconnected: isDisconnected,
    hasQr: !!qrCodeData,
  });
});

app.post("/wa/reconnect", (req, res) => {
  try {
    console.log("Reconnect requested");
    if (client) {
      client.destroy();
    }
    isReady = false;
    isDisconnected = false;
    qrCodeData = null;

    // Clear session and restart
    clearSession();
    setTimeout(() => {
      startWhatsApp();
      res.json({ success: true, message: "Reconnecting..." });
    }, 1000);
  } catch (error) {
    console.error("Reconnect error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/wa/force-ready", (req, res) => {
  try {
    console.log("Force ready requested");
    if (!client) {
      return res.status(400).json({ error: "WhatsApp client not initialized" });
    }

    if (isAuthenticated && !isReady) {
      // Test apakah client bisa melakukan operasi dasar
      client
        .getState()
        .then((state) => {
          console.log("Client state before forcing ready:", state);
          if (state === "CONNECTED") {
            // Test lagi dengan getChats untuk memastikan benar-benar ready
            return client.getChats();
          } else {
            throw new Error(`Client state is ${state}, not CONNECTED`);
          }
        })
        .then((chats) => {
          console.log(
            "Client successfully tested with getChats, found",
            chats.length,
            "chats"
          );
          isReady = true;
          isLoading = false;
          qrCodeData = null;
          console.log("Forced WhatsApp to ready state after full verification");
          res.json({
            success: true,
            message: "WhatsApp forced to ready state after verification",
          });
        })
        .catch((error) => {
          console.error("Client not ready for operations:", error.message);
          res.status(400).json({
            error: "Client not ready for operations yet: " + error.message,
            suggestion: "Please wait a bit more or try reconnecting",
          });
        });
    } else if (isReady) {
      res.json({ success: true, message: "WhatsApp already ready" });
    } else {
      res.status(400).json({ error: "WhatsApp not authenticated yet" });
    }
  } catch (error) {
    console.error("Force ready error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/wa/force-new-session", (req, res) => {
  try {
    console.log("Force new session requested");
    if (client) {
      client.destroy();
    }
    isReady = false;
    isDisconnected = true;
    qrCodeData = null;

    // Force clear session
    clearSession();

    setTimeout(() => {
      startWhatsApp();
      res.json({ success: true, message: "Starting new session..." });
    }, 2000);
  } catch (error) {
    console.error("Force new session error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/wa/logout", async (req, res) => {
  try {
    if (!isReady || !client) {
      return res.status(400).json({ error: "WhatsApp not connected" });
    }

    // Logout dari device WhatsApp
    await client.logout();

    // Reset semua status
    isReady = false;
    isDisconnected = true;
    qrCodeData = null;

    // Clear session
    clearSession();

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/wa/send", (req, res) => {
  if (!isReady) return res.status(400).json({ error: "WhatsApp not ready." });
  const { number, message, isGroup, mentions } = req.body;

  const options = {};
  if (isGroup && mentions && mentions.length > 0) {
    options.mentions = mentions;
  }

  client
    .sendMessage(number, message, options)
    .then(() => res.json({ success: true }))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.get("/wa/groups", async (req, res) => {
  try {
    console.log(
      "Groups endpoint called. Ready:",
      isReady,
      "Client exists:",
      !!client
    );

    if (!isReady || !client) {
      return res.status(400).json({ 
        error: "WhatsApp not connected",
        suggestion: "Please wait for WhatsApp to connect or scan QR code" 
      });
    }

    // Fungsi untuk mencoba getChats dengan retry
    const tryGetChats = async (retryCount = 0, maxRetries = 3) => {
      try {
        console.log(`Attempting getChats (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        // Cek state terlebih dahulu
        const state = await client.getState();
        console.log("Client state:", state);
        
        if (state !== "CONNECTED") {
          throw new Error(`Client state is ${state}, not CONNECTED`);
        }

        // Coba getChats
        const chats = await client.getChats();
        console.log(`✅ Successfully got ${chats.length} chats`);
        return chats;
        
      } catch (error) {
        console.log(`❌ getChats attempt ${retryCount + 1} failed:`, error.message);
        
        if (retryCount < maxRetries) {
          console.log(`Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return tryGetChats(retryCount + 1, maxRetries);
        } else {
          throw error;
        }
      }
    };

    // Coba ambil chats dengan retry mechanism
    const chats = await tryGetChats();

    // Filter hanya grup
    const groups = chats.filter((chat) => chat.isGroup);

    // Format response
    const groupList = groups.map((group, index) => ({
      index: index + 1,
      name: group.name,
      id: group.id._serialized,
      participants: group.participants ? group.participants.length : 0,
    }));

    console.log(`✅ Found ${groupList.length} groups`);

    res.json({
      success: true,
      total: groupList.length,
      groups: groupList,
    });
    
  } catch (error) {
    console.error("❌ Groups endpoint final error:", error.message);
    res.status(500).json({
      error: "Failed to get groups: " + error.message,
      suggestion: "WhatsApp client may not be fully ready. Please wait a moment and try again, or reconnect WhatsApp.",
    });
  }
});

// Start WhatsApp client
startWhatsApp();

// Schedule messages for weekdays only (Monday-Friday)
// Morning brief at 09:00 (Monday-Friday)
schedule.scheduleJob("23 10 * * 1-5", () => {
  if (isReady && groupId) {
    const tanggal = dayjs().format("DD/MM/YYYY");
    client
      .sendMessage(
        groupId,
        `#MorningBrief #${tanggal}

Untuk Hari ini mau mengerjakan apa saja ? dan apakah ada kendala atau masalah?

cc @6285806083274 @6289501201414 @6285704134504 `,
        {
          mentions: [targetNumber],
        }
      )
      .catch(() => {});
  }
});

// Evening brief at 17:00 (Monday-Friday)
// schedule.scheduleJob('0 17 * * 1-5', () => {
//   if (isReady && groupId) {
//     const tanggal = dayjs().format('DD/MM/YYYY');
//     client.sendMessage(groupId, `#commit #${tanggal}

// J`, {
//       mentions: [targetNumber]
//     })
//       .catch(() => {});
//   }
// });

app.listen(3001, () => {
  console.log("WhatsApp server running on port 3001");
});
