const seedProjects = async () => {
    const API_URL = 'http://localhost:5000/api/projects';

    try {
        // Calculate dates
        const now = new Date();
        const currentMonth = now.toISOString().split('T')[0];

        const prevMonthDate = new Date(now);
        prevMonthDate.setMonth(now.getMonth() - 1);
        const prevMonth = prevMonthDate.toISOString().split('T')[0];

        const twoMonthsAgoDate = new Date(now);
        twoMonthsAgoDate.setMonth(now.getMonth() - 2);
        const twoMonthsAgo = twoMonthsAgoDate.toISOString().split('T')[0];

        const nextMonthDate = new Date(now);
        nextMonthDate.setMonth(now.getMonth() + 1);
        const nextMonth = nextMonthDate.toISOString().split('T')[0];

        const projects = [
            {
                name: 'Project Current Month (In Progress)',
                clientId: 'test-client-a',
                client: 'Test Client A', // Backend expects 'client' name
                type: 'Residential',
                status: 'in-progress',
                startDate: currentMonth,
                price: 10000,
                progress: 50,
                description: 'Test project for current month filtering',
                team: [] // Optional
            },
            {
                name: 'Project Previous Month (In Progress)',
                clientId: 'test-client-b',
                client: 'Test Client B',
                type: 'Commercial',
                status: 'in-progress',
                startDate: prevMonth,
                price: 20000,
                progress: 75,
                description: 'Test project started last month, still active',
                team: []
            },
            {
                name: 'Project Previous Month (Completed)',
                clientId: 'test-client-c',
                client: 'Test Client C',
                type: 'Industrial',
                status: 'completed',
                startDate: prevMonth,
                price: 15000,
                progress: 100,
                description: 'Test project completed last month',
                team: []
            },
            {
                name: 'Project 2 Months Ago (Completed)',
                clientId: 'test-client-d',
                client: 'Test Client D',
                type: 'Residential',
                status: 'completed',
                startDate: twoMonthsAgo,
                price: 12000,
                progress: 100,
                description: 'Old completed project',
                team: []
            },
            {
                name: 'Project Next Month (Draft)',
                clientId: 'test-client-e',
                client: 'Test Client E',
                type: 'Government',
                status: 'draft',
                startDate: nextMonth,
                price: 50000,
                progress: 0,
                description: 'Future project',
                team: []
            }
        ];

        console.log('🌱 Seeding projects via API...');

        for (const project of projects) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ project: project, tasks: [], createdByName: 'System Seed' }) // Matching frontend payload structure
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Created: ${project.name}`);
                } else {
                    const errorText = await response.text();
                    console.error(`❌ Failed to create ${project.name}: ${response.status} ${response.statusText}`, errorText);
                }
            } catch (err) {
                console.error(`❌ Error creating ${project.name}:`, err.message);
            }
        }

        console.log('✨ Seeding process completed.');

    } catch (error) {
        console.error('❌ Script failed:', error);
    }
};

seedProjects();
