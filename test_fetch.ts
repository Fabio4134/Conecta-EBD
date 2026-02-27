import axios from 'axios';

async function testFetch() {
    try {
        const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admtntemplocentral@ebd.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login success');

        const classRes = await axios.get('http://localhost:3001/api/classes', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Classes:', classRes.data);

        const teacherRes = await axios.get('http://localhost:3001/api/teachers', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Teachers:', teacherRes.data);

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testFetch();
