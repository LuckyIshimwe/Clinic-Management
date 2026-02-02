const mongoose = require('mongoose');
const dns = require('dns');


dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']); 

const connectDB = async () => {
  try {
    
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, 
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;