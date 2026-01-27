const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/buy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'buy.html'));
});

app.get('/sell', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sell.html'));
});

// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

// API to get books
app.get('/api/books', (req, res) => {
    try {
        const booksPath = path.join(__dirname, 'books.json');
        let books = [];
        
        if (fs.existsSync(booksPath)) {
            const data = fs.readFileSync(booksPath, 'utf8');
            books = JSON.parse(data);
        }
        
        res.json(books);
    } catch (error) {
        console.error('Error loading books:', error);
        res.status(500).json({ error: 'Failed to load books' });
    }
});

// API to save books
app.post('/api/books', (req, res) => {
    try {
        const { 
            studentName, 
            schoolName, 
            className, 
            classRoom, 
            bookName, 
            medium, 
            price, 
            phoneNumber, 
            bookDescription, 
            additionalMessages,
            photos = []
        } = req.body;
        
        // Validate required fields
        if (!studentName || !schoolName || !className || !classRoom || !bookName || !medium || !price || !bookDescription) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be filled' 
            });
        }
        
        // Save images if provided
        const savedImagePaths = [];
        if (photos && photos.length > 0) {
            photos.forEach((base64Image, index) => {
                try {
                    const matches = base64Image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        const imageBuffer = Buffer.from(matches[2], 'base64');
                        const imageName = `book_${Date.now()}_${index}.jpg`;
                        const imagePath = path.join(uploadsDir, imageName);
                        
                        fs.writeFileSync(imagePath, imageBuffer);
                        savedImagePaths.push(`/uploads/${imageName}`);
                    }
                } catch (imageError) {
                    console.error('Error saving image:', imageError);
                }
            });
        }
        
        const newBook = {
            id: Date.now(),
            studentName: studentName.trim(),
            schoolName: schoolName.trim(),
            className: className.trim(),
            classRoom: classRoom.trim(),
            bookName: bookName.trim(),
            medium: medium.trim(),
            price: price.trim(),
            phoneNumber: phoneNumber ? phoneNumber.trim() : '',
            bookDescription: bookDescription.trim(),
            additionalMessages: additionalMessages ? additionalMessages.trim() : '',
            photos: savedImagePaths,
            date: new Date().toLocaleDateString('en-IN')
        };
        
        // Read existing books
        const booksPath = path.join(__dirname, 'books.json');
        let books = [];
        
        if (fs.existsSync(booksPath)) {
            const data = fs.readFileSync(booksPath, 'utf8');
            books = JSON.parse(data);
        }
        
        // Add new book
        books.push(newBook);
        
        // Save back to file
        fs.writeFileSync(booksPath, JSON.stringify(books, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Book posted successfully!',
            id: newBook.id
        });
        
    } catch (error) {
        console.error('Error saving book:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving book: ' + error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 STUDENTSHELF server running on http://localhost:${PORT}`);
    console.log('📚 Available pages:');
    console.log('   Home  - http://localhost:3000');
    console.log('   Buy   - http://localhost:3000/buy');
    console.log('   Sell  - http://localhost:3000/sell');
});