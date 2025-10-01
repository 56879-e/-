const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 7878;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// مسارات الملفات
const PASSWORDS_FILE = 'passwords.json';
const CODES_FILE = 'codes.json';
const NOTEBOOKS_FILE = 'notebooks.json';

// التأكد من وجود الملفات
function ensureFiles() {
    if (!fs.existsSync(PASSWORDS_FILE)) {
        fs.writeFileSync(PASSWORDS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(CODES_FILE)) {
        fs.writeFileSync(CODES_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(NOTEBOOKS_FILE)) {
        const defaultNotebooks = {
            first: { videos: [], files: [] },
            second: { videos: [], files: [] },
            third: { videos: [], files: [] }
        };
        fs.writeFileSync(NOTEBOOKS_FILE, JSON.stringify(defaultNotebooks, null, 2));
    }
}

// قراءة وكتابة سجلات الدفاتر
function readNotebooks() {
    try {
        const data = fs.readFileSync(NOTEBOOKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { first: { videos: [], files: [] }, second: { videos: [], files: [] }, third: { videos: [], files: [] } };
    }
}

function writeNotebooks(notebooks) {
    try {
        // backup previous
        if (fs.existsSync(NOTEBOOKS_FILE)) {
            const prev = fs.readFileSync(NOTEBOOKS_FILE, 'utf8');
            fs.writeFileSync('notebooks_backup.json', prev);
        }
    } catch (err) {
        console.error('Backup error:', err && err.message);
    }
    fs.writeFileSync(NOTEBOOKS_FILE, JSON.stringify(notebooks, null, 2));
}

// قراءة البيانات من الملفات
function readPasswords() {
    try {
        const data = fs.readFileSync(PASSWORDS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function readCodes() {
    try {
        const data = fs.readFileSync(CODES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// كتابة البيانات إلى الملفات
function writePasswords(passwords) {
    fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(passwords, null, 2));
}

function writeCodes(codes) {
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
}

// API Routes

// جلب كلمات السر
app.get('/api/passwords', (req, res) => {
    ensureFiles();
    const passwords = readPasswords();
    res.json(passwords);
});

// إضافة كلمة سر جديدة
app.post('/api/passwords', (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: 'كلمة السر مطلوبة' });
        }
        
        ensureFiles();
        const passwords = readPasswords();
        
        // التحقق من عدم تكرار كلمة السر
        if (passwords.includes(password)) {
            return res.status(400).json({ error: 'كلمة السر موجودة بالفعل' });
        }
        
        passwords.push(password);
        writePasswords(passwords);
        
        res.json({ message: 'تم إضافة كلمة السر بنجاح', password });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// حذف كلمة سر
app.delete('/api/passwords/:password', (req, res) => {
    try {
        const { password } = req.params;
        ensureFiles();
        const passwords = readPasswords();
        
        const index = passwords.indexOf(password);
        if (index === -1) {
            return res.status(404).json({ error: 'كلمة السر غير موجودة' });
        }
        
        passwords.splice(index, 1);
        writePasswords(passwords);
        
        res.json({ message: 'تم حذف كلمة السر بنجاح' });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// جلب الأكواد
app.get('/api/codes', (req, res) => {
    ensureFiles();
    const codes = readCodes();
    res.json(codes);
});

// جلب سجلات الدفاتر
app.get('/api/notebooks', (req, res) => {
    try {
        ensureFiles();
        const notebooks = readNotebooks();
        res.json(notebooks);
    } catch (err) {
        res.status(500).json({ error: 'خطأ في جلب سجلات الدفاتر' });
    }
});

// حفظ سجلات الدفاتر (استبدال كامل)
app.post('/api/notebooks', (req, res) => {
    try {
        const notebooks = req.body;
        if (!notebooks) {
            return res.status(400).json({ error: 'البيانات مطلوبة' });
        }
        ensureFiles();
        writeNotebooks(notebooks);
        res.json({ message: 'تم حفظ سجلات الدفاتر بنجاح' });
    } catch (err) {
        res.status(500).json({ error: 'خطأ في حفظ سجلات الدفاتر' });
    }
});

// استعادة النسخة الاحتياطية
app.get('/api/notebooks/restore-backup', (req, res) => {
    try {
        if (!fs.existsSync('notebooks_backup.json')) {
            return res.status(404).json({ error: 'لا توجد نسخة احتياطية' });
        }
        const data = fs.readFileSync('notebooks_backup.json', 'utf8');
        const notebooks = JSON.parse(data);
        writeNotebooks(notebooks);
        res.json({ message: 'تمت استعادة النسخة الاحتياطية' });
    } catch (err) {
        res.status(500).json({ error: 'خطأ أثناء الاستعادة' });
    }
});

// إضافة كود جديد
app.post('/api/codes', (req, res) => {
    try {
        const { password, videoId, fileId, code, maxUses } = req.body;
        
        if (!password || !code) {
            return res.status(400).json({ error: 'كلمة السر والكود مطلوبان' });
        }
        
        if (!videoId && !fileId) {
            return res.status(400).json({ error: 'يجب تحديد رمز الفيديو أو الملف' });
        }
        
        ensureFiles();
        const codes = readCodes();
        
        // إنشاء كود جديد
        const newCode = {
            id: Date.now().toString(),
            password,
            videoId: videoId || '',
            fileId: fileId || '',
            code,
            used: false,
            useCount: 0,
            maxUses: maxUses || 2,
            createdAt: new Date().toISOString()
        };
        
        codes.push(newCode);
        writeCodes(codes);
        
        res.json({ message: 'تم إضافة الكود بنجاح', code: newCode });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تحديث حالة الكود (مستخدم/غير مستخدم)
app.patch('/api/codes/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { used, useCount, maxUses } = req.body;
        
        ensureFiles();
        const codes = readCodes();
        
        const codeIndex = codes.findIndex(c => c.id === id);
        if (codeIndex === -1) {
            return res.status(404).json({ error: 'الكود غير موجود' });
        }
        
        if (used !== undefined) {
            codes[codeIndex].used = used;
            // إذا تم تفعيل الكود، إعادة تعيين عدد مرات الاستخدام
            if (used === false) {
                codes[codeIndex].useCount = 0;
            }
        }
        if (useCount !== undefined) {
            codes[codeIndex].useCount = useCount;
        }
        if (maxUses !== undefined) {
            codes[codeIndex].maxUses = maxUses;
        }
        
        codes[codeIndex].updatedAt = new Date().toISOString();
        
        writeCodes(codes);
        
        res.json({ message: 'تم تحديث حالة الكود بنجاح', code: codes[codeIndex] });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// زيادة عدد مرات استخدام الكود
app.post('/api/codes/:id/use', (req, res) => {
    try {
        const { id } = req.params;
        
        ensureFiles();
        const codes = readCodes();
        
        const codeIndex = codes.findIndex(c => c.id === id);
        if (codeIndex === -1) {
            return res.status(404).json({ error: 'الكود غير موجود' });
        }
        
        const code = codes[codeIndex];
        
        // زيادة عدد مرات الاستخدام
        code.useCount = (code.useCount || 0) + 1;
        
        // إذا وصل للحد الأقصى، تعليمه كمستخدم
        if (code.useCount >= (code.maxUses || 2)) {
            code.used = true;
        }
        
        code.updatedAt = new Date().toISOString();
        
        writeCodes(codes);
        
        res.json({ 
            message: 'تم تحديث عدد مرات الاستخدام', 
            code: code,
            canUse: code.useCount < (code.maxUses || 2)
        });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// حذف كود
app.delete('/api/codes/:id', (req, res) => {
    try {
        const { id } = req.params;
        ensureFiles();
        const codes = readCodes();
        
        const codeIndex = codes.findIndex(c => c.id === id);
        if (codeIndex === -1) {
            return res.status(404).json({ error: 'الكود غير موجود' });
        }
        
        codes.splice(codeIndex, 1);
        writeCodes(codes);
        
        res.json({ message: 'تم حذف الكود بنجاح' });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
    console.log(`يمكنك الوصول إلى لوحة الأدمن على: http://localhost:${PORT}/admin.html`);
    ensureFiles();
});
