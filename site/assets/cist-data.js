/* CIST data: edit this one file to update districts, villages, projects and courses.
   projects[].faculty = name of the monitoring faculty (shows in the project drawer).
   villages[].coords = [lat, lng], add only after the location is verified. */
window.CISTDATA={
 "districts": [
  {
   "id": "moinabad",
   "name": "Moinabad",
   "note": "Ranga Reddy",
   "center": [
    17.3267,
    78.2752
   ],
   "centerNote": "Moinabad (mandal headquarters)"
  },
  {
   "id": "kamareddy",
   "name": "Kamareddy",
   "note": "",
   "center": [
    18.32,
    78.34
   ],
   "centerNote": "Kamareddy (district centre, approximate)"
  },
  {
   "id": "suryapet",
   "name": "Suryapet",
   "note": "",
   "center": [
    17.14,
    79.62
   ],
   "centerNote": "Suryapet (district centre, approximate)"
  },
  {
   "id": "vikarabad",
   "name": "Vikarabad",
   "note": "",
   "center": [
    17.338,
    77.904
   ],
   "centerNote": "Vikarabad (district centre, approximate)"
  }
 ],
 "villages": [
  {
   "id": "v1",
   "name": "Appojiguda",
   "district": "moinabad",
   "focus": "Women empowerment and skill development.",
   "coords": null
  },
  {
   "id": "v2",
   "name": "Yethbar Pally",
   "district": "moinabad",
   "focus": "Initiatives for sustainable agriculture.",
   "coords": null
  },
  {
   "id": "v3",
   "name": "Sriram Nagar",
   "district": "moinabad",
   "focus": "Primary hub for student-led rural projects.",
   "coords": [
    17.26764,
    78.25717
   ]
  },
  {
   "id": "v4",
   "name": "Nakkalapally",
   "district": "moinabad",
   "focus": "Community development and health awareness.",
   "coords": null
  },
  {
   "id": "v5",
   "name": "Tholkatta",
   "district": "moinabad",
   "focus": "Clean water and rural innovation.",
   "coords": [
    17.29767,
    78.20769
   ]
  },
  {
   "id": "v6",
   "name": "Yelkaguda",
   "district": "moinabad",
   "focus": "Sanitation and hygiene improvement campaigns.",
   "coords": null
  },
  {
   "id": "v7",
   "name": "Sajjanapally",
   "district": "moinabad",
   "focus": "Solar electrification and digital literacy.",
   "coords": null
  },
  {
   "id": "v8",
   "name": "Nemaligutta Thanda",
   "district": "kamareddy",
   "focus": "Community interaction and socio-economic surveys.",
   "coords": null
  },
  {
   "id": "v9",
   "name": "Marrithanda",
   "district": "kamareddy",
   "focus": "Agricultural problem scoping and technology interventions.",
   "coords": null
  },
  {
   "id": "v10",
   "name": "Somarampet",
   "district": "kamareddy",
   "focus": "Renewable energy awareness programs.",
   "coords": null
  },
  {
   "id": "v11",
   "name": "Banjepally",
   "district": "kamareddy",
   "focus": "Deployment of low-cost cooling chambers.",
   "coords": null
  },
  {
   "id": "v12",
   "name": "Sardapur",
   "district": "kamareddy",
   "focus": "Educational outreach and STEM activities.",
   "coords": null
  },
  {
   "id": "v13",
   "name": "Bhilya Nayak Thanda",
   "district": "suryapet",
   "focus": "Rural innovation and startup initiatives.",
   "coords": null
  },
  {
   "id": "v14",
   "name": "Kerali",
   "district": "vikarabad",
   "focus": "NGO partnerships and sustainable rural planning.",
   "coords": null
  },
  {
   "id": "v15",
   "name": "Dornal",
   "district": "vikarabad",
   "focus": "Solar fencing deployment for local farms.",
   "coords": null
  }
 ],
 "sites": [
  {
   "id": "s1",
   "name": "Surangal",
   "coords": [
    17.29683,
    78.27332
   ],
   "note": "Project site, Moinabad area"
  }
 ],
 "projects": [
  {
   "id": "p1",
   "name": "Solar-Based Automated Incense Stick Machine",
   "village": "Sriram Nagar",
   "villageId": "v3",
   "siteId": null,
   "status": "Deployed",
   "category": "Livelihood and solar energy",
   "description": "A solar-powered machine that automates incense stick making.",
   "faculty": ""
  },
  {
   "id": "p2",
   "name": "IoT-Based Cooling Chamber",
   "village": "Surangal",
   "villageId": null,
   "siteId": "s1",
   "status": "Deployed",
   "category": "Agri-technology and post-harvest",
   "description": "An IoT-enabled cooling chamber for storing farm produce.",
   "faculty": ""
  },
  {
   "id": "p3",
   "name": "Grim Reaper Binder",
   "village": "Surangal",
   "villageId": null,
   "siteId": "s1",
   "status": "Deployed",
   "category": "Agricultural machinery",
   "description": "A reaper binder for harvesting and bundling crops.",
   "faculty": ""
  },
  {
   "id": "p4",
   "name": "Hand Lever-Based Tapioca Plant Uprooter",
   "village": "Shadnagar",
   "villageId": null,
   "siteId": null,
   "status": "Deployed",
   "category": "Agricultural implement",
   "description": "A hand-lever tool for uprooting tapioca plants.",
   "faculty": ""
  },
  {
   "id": "p5",
   "name": "Multi-Tool Agricultural Implement",
   "village": "Kammadanam",
   "villageId": null,
   "siteId": null,
   "status": "Deployed",
   "category": "Agricultural implement",
   "description": "A single implement that serves several farming tasks.",
   "faculty": ""
  },
  {
   "id": "p6",
   "name": "Integrated Smart Solar Fencing",
   "village": "Sajjanapally",
   "villageId": "v7",
   "siteId": null,
   "status": "Deployed",
   "category": "Solar energy and crop protection",
   "description": "A smart fence powered by solar energy.",
   "faculty": ""
  },
  {
   "id": "p7",
   "name": "Banjara Embroidery Plus Mobile Milk Storage",
   "village": "Kamareddy",
   "villageId": null,
   "siteId": null,
   "status": "Deployed",
   "category": "Livelihood and dairy",
   "description": "Banjara embroidery livelihood work, together with a mobile milk storage facility.",
   "faculty": ""
  },
  {
   "id": "p8",
   "name": "Eco Burner: Biochar Fabrication",
   "village": "Dornal",
   "villageId": "v15",
   "siteId": null,
   "status": "Deployed",
   "category": "Environment and clean energy",
   "description": "A burner that fabricates biochar.",
   "faculty": ""
  },
  {
   "id": "p9",
   "name": "Automated Incense Stick Machine (Rose Farmers)",
   "village": "Nakkalapally",
   "villageId": "v4",
   "siteId": null,
   "status": "Deployed",
   "category": "Livelihood",
   "description": "An automated incense stick machine for rose farmers.",
   "faculty": ""
  },
  {
   "id": "p10",
   "name": "Paddy Green Dryer",
   "village": "Appareddyguda",
   "villageId": null,
   "siteId": null,
   "status": "Deployed",
   "category": "Agriculture and post-harvest",
   "description": "A green dryer for drying paddy.",
   "faculty": ""
  },
  {
   "id": "p11",
   "name": "Farmicon App (F2C: Removing Middlemen)",
   "village": "Nakkalapally",
   "villageId": "v4",
   "siteId": null,
   "status": "Deployed",
   "category": "Digital agriculture",
   "description": "A farmer-to-consumer (F2C) app that removes middlemen.",
   "faculty": ""
  },
  {
   "id": "p12",
   "name": "Recycled Plastic Bus Shelter",
   "village": "Nakkalapally",
   "villageId": "v4",
   "siteId": null,
   "status": "Deployed",
   "category": "Waste recycling and public infrastructure",
   "description": "A bus shelter built from recycled plastic.",
   "faculty": ""
  }
 ],
 "courses": [
  {
   "year": 1,
   "sem": "Sem I",
   "name": "Design Thinking and Sustainable Development",
   "text": "Design thinking frameworks applied to sustainable development challenges."
  },
  {
   "year": 1,
   "sem": "Sem II",
   "name": "Social Innovation",
   "text": "Innovation models for addressing social problems in communities."
  },
  {
   "year": 2,
   "sem": "Sem I",
   "name": "Innovations for Sustainable Development-I",
   "text": "Hands-on project development for community sustainability challenges."
  },
  {
   "year": 2,
   "sem": "Sem II",
   "name": "Innovations for Sustainable Development-II",
   "text": "Advanced sustainable innovation projects with a community deployment focus."
  },
  {
   "year": 3,
   "sem": "Sem II",
   "name": "Rural Innovation and Sustainable Startups-I",
   "text": "Rural problem identification and startup ideation for agricultural communities."
  },
  {
   "year": 3,
   "sem": "Sem II",
   "name": "Rural Innovation and Sustainable Startups-II",
   "text": "Prototype development and startup launch strategies for rural innovations."
  },
  {
   "year": 4,
   "sem": "Sem I",
   "name": "Innovation and Entrepreneurship in Engineering-I",
   "text": "Engineering entrepreneurship principles and commercialisation strategies."
  },
  {
   "year": 4,
   "sem": "Sem I",
   "name": "Innovation and Entrepreneurship in Engineering-II",
   "text": "Advanced venture development and investor pitch preparation."
  }
 ]
};