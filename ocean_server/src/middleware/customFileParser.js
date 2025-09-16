const multer = require('multer');

// Custom file parser for React Native FormData
const customFileParser = (req, res, next) => {
    // First try multer
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 50 * 1024 * 1024 // 50MB limit
        }
    });
    
    upload.array('media', 10)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
            }
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        
        // If multer didn't process files, check for base64 data in body
        if (!req.files) {
            console.log('No files processed by multer, checking for base64 data...');
            console.log('Request body keys:', Object.keys(req.body));
            console.log('Media data present:', !!req.body.media);
            console.log('Media name present:', !!req.body.media_name);
            console.log('Media type present:', !!req.body.media_type);
            
            // Check if we have base64 media data
            const mediaData = req.body.media;
            const mediaName = req.body.media_name;
            const mediaType = req.body.media_type;
            
            console.log('Media data type:', typeof mediaData);
            console.log('Media data starts with data:', mediaData ? mediaData.startsWith('data:') : 'no data');
            console.log('Media data length:', mediaData ? mediaData.length : 'no data');
            
            if (mediaData && typeof mediaData === 'string' && mediaData.startsWith('data:')) {
                console.log('Found base64 media data');
                console.log('Media data length:', mediaData.length);
                console.log('Media name:', mediaName);
                console.log('Media type:', mediaType);
                
                // Convert base64 to buffer
                const base64Data = mediaData.split(',')[1]; // Remove data:image/jpeg;base64,
                const buffer = Buffer.from(base64Data, 'base64');
                
                console.log('Base64 data length:', base64Data.length);
                console.log('Buffer length:', buffer.length);
                
                req.files = [{
                    fieldname: 'media',
                    originalname: mediaName || 'image.jpg',
                    encoding: '7bit',
                    mimetype: mediaType || 'image/jpeg',
                    buffer: buffer,
                    size: buffer.length
                }];
                
                console.log('Converted base64 to file:', req.files.length);
                console.log('File object:', {
                    fieldname: req.files[0].fieldname,
                    originalname: req.files[0].originalname,
                    mimetype: req.files[0].mimetype,
                    size: req.files[0].size,
                    bufferLength: req.files[0].buffer.length
                });
            } else {
                console.log('No base64 media data found');
                console.log('Media data:', mediaData);
                console.log('Media name:', mediaName);
                console.log('Media type:', mediaType);
            }
        }
        
        next();
    });
};

module.exports = customFileParser;
