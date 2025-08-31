/**
 * Business Nexus Demo Seeder
 * Usage:
 *   cd server
 *   node scripts/seed.js
 *
 * Adds demo users (password: demo1234), a request (accepted), and a short chat history.
 */
import 'dotenv/config.js';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Request from '../src/models/Request.js';
import Message from '../src/models/Message.js';

function log(step, data) {
  console.log(`\n=== ${step} ===`);
  if (data) console.log(data);
}

async function main() {
  await connectDB();

  // Clear out any previous demo users
  const demoEmails = [
    'alice@founder.test',
    'bob@founder.test',
    'ivy@investor.test',
    'neo@investor.test'
  ];
  await User.deleteMany({ email: { $in: demoEmails } });
  log('Removed existing demo users');

  // Create demo users
  const [alice, bob, ivy, neo] = await User.create([
    {
      name: 'Alice Founder',
      email: 'alice@founder.test',
      password: 'demo1234',
      role: 'entrepreneur',
      bio: 'Building a B2B SaaS for supply-chain analytics. Looking for seed partners.',
      sectors: ['SaaS', 'Supply Chain'],
      skills: ['Product', 'Analytics']
    },
    {
      name: 'Bob Builder',
      email: 'bob@founder.test',
      password: 'demo1234',
      role: 'entrepreneur',
      bio: 'Fintech dev; compliance automation for SMEs.',
      sectors: ['Fintech', 'SME'],
      skills: ['Node.js', 'Compliance']
    },
    {
      name: 'Ivy Capital',
      email: 'ivy@investor.test',
      password: 'demo1234',
      role: 'investor',
      bio: 'Angel/seed investor; focus on B2B SaaS with early traction.',
      sectors: ['SaaS', 'B2B'],
      skills: ['Fundraising', 'Go-to-market']
    },
    {
      name: 'Neo Ventures',
      email: 'neo@investor.test',
      password: 'demo1234',
      role: 'investor',
      bio: 'Pre-seed tickets in data/AI infra.',
      sectors: ['AI', 'Infra'],
      skills: ['Strategy', 'Data']
    }
  ]);
  log('Created users', { alice: alice.email, bob: bob.email, ivy: ivy.email, neo: neo.email });

  // Collaboration request Alice → Ivy (accepted)
  const req = await Request.create({
    from: alice._id,
    to: ivy._id,
    message: 'Hi Ivy — would love to chat about our SaaS traction.',
    status: 'pending'
  });
  req.status = 'accepted';
  await req.save();
  log('Request Alice → Ivy accepted');

  // Chat history
  const now = new Date();
  const earlier = new Date(now.getTime() - 1000 * 60 * 10); // 10 minutes ago
  await Message.create([
    { from: alice._id, to: ivy._id, body: 'Hi Ivy! Thanks for connecting 🙌', createdAt: earlier, updatedAt: earlier },
    { from: ivy._id, to: alice._id, body: 'Great to connect, Alice. What metrics are you tracking?', createdAt: new Date(earlier.getTime() + 2*60*1000), updatedAt: new Date(earlier.getTime() + 2*60*1000) },
    { from: alice._id, to: ivy._id, body: 'MRR 12k, MoM 18% with 20 design partners.', createdAt: new Date(earlier.getTime() + 4*60*1000), updatedAt: new Date(earlier.getTime() + 4*60*1000) }
  ]);
  log('Seeded messages');

  console.log('\n✅ Done. Demo accounts (password: demo1234):');
  console.table([
    { email: alice.email, role: alice.role },
    { email: bob.email, role: bob.role },
    { email: ivy.email, role: ivy.role },
    { email: neo.email, role: neo.role }
  ]);

  await mongoose.connection.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
