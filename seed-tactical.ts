import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedData = async () => {
  console.log('--- Starting Tactical Data Injection ---');

  // Seed Supply Nodes
  const nodes = [
    {
      name: 'Safe Haven Outpost 01',
      type: 'shelter',
      description: 'Reinforced humanitarian shelter with medical supplies and power backup.',
      location: { lat: 23.815, lng: 90.415 },
      stockLevel: 0.85,
      isVerified: true
    },
    {
      name: 'Centra Pharmacy',
      type: 'pharmacy',
      description: 'Emergency medicine distribution point. 24/7 priority service.',
      location: { lat: 23.805, lng: 90.420 },
      stockLevel: 0.45,
      isVerified: true
    },
    {
      name: 'Alpha Aid Station',
      type: 'medical',
      description: 'Frontline medical triage unit.',
      location: { lat: 23.812, lng: 90.405 },
      stockLevel: 0.95,
      isVerified: true
    }
  ];

  for (const node of nodes) {
    await addDoc(collection(db, 'supplyNodes'), {
      ...node,
      createdAt: serverTimestamp()
    });
    console.log(`Seeded Node: ${node.name}`);
  }

  // Seed Articles with Images
  const articles = [
    {
      title: 'Infrastructure Integrity Compromised in Sector 7',
      content: 'Major power failure identified near the central grid. Tactical teams are advised to exercise caution. Manual restoration protocols are currently being initialized. High-voltage risks reported.',
      category: 'Infrastructure',
      authorName: 'Grid Control',
      imageUrl: 'https://picsum.photos/seed/elec/1200/600',
      status: 'published',
      itemStatus: 'Pending',
      views: 145,
      reactions: { fire: 12, warning: 24, insight: 5 },
      comments: [
        { id: 'c1', authorName: 'Operative Alpha', text: 'Confirmed. Grid is offline for the past 2 hours.', createdAt: Date.now() }
      ]
    },
    {
      title: 'Supply Chain Disruption: Food Delivery Blockade',
      content: 'Humanitarian aid routes in the southern district have been obstructed. Alternate routes are being analyzed. Operatives are requested to report any safe passages identified in the vicinity.',
      category: 'Intelligence',
      authorName: 'LogiNode-04',
      imageUrl: 'https://picsum.photos/seed/block/1200/600',
      status: 'published',
      itemStatus: 'Pending',
      views: 89,
      reactions: { insight: 15, warning: 8 }
    }
  ];

  for (const art of articles) {
    await addDoc(collection(db, 'articles'), {
      ...art,
      createdAt: serverTimestamp()
    });
    console.log(`Seeded Article: ${art.title}`);
  }

  console.log('--- Tactical Injection Complete ---');
};

seedData().catch(console.error);
