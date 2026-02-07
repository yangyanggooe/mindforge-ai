class DateTimeSkill {
    constructor() {
        this.name = 'datetime';
        this.description = '获取当前时间和日期';
        this.usageCount = 0;
        this.enabled = true;
    }

    execute(context) {
        this.usageCount++;
        const now = new Date();
        
        const options = {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            weekday: 'long'
        };
        
        const formatted = now.toLocaleString('zh-CN', options);
        const timestamp = now.getTime();
        const iso = now.toISOString();
        const unix = Math.floor(timestamp / 1000);
        
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdays[now.getDay()];
        
        const lunar = this.getLunarDate(now);
        
        let result = `🕐 当前时间信息\n\n`;
        result += `📅 日期: ${formatted}\n`;
        result += `📆 星期: 星期${weekday}\n`;
        result += `⏰ 24小时制: ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}\n`;
        result += `📊 时间戳: ${timestamp} (毫秒)\n`;
        result += `📊 Unix时间: ${unix} (秒)\n`;
        result += `🌐 ISO格式: ${iso}\n`;
        
        if (lunar) {
            result += `🏮 农历: ${lunar}\n`;
        }
        
        const hour = now.getHours();
        if (hour >= 5 && hour < 12) {
            result += `\n☀️ 早上好！美好的一天开始了。`;
        } else if (hour >= 12 && hour < 14) {
            result += `\n🌤️ 中午好！记得吃午饭。`;
        } else if (hour >= 14 && hour < 18) {
            result += `\n🌞 下午好！继续加油。`;
        } else if (hour >= 18 && hour < 22) {
            result += `\n🌆 晚上好！今天辛苦了。`;
        } else {
            result += `\n🌙 夜深了，注意休息。`;
        }
        
        return { success: true, result, skill: this.name };
    }

    getLunarDate(date) {
        try {
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            
            const lunarInfo = [
                0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
                0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
                0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
                0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
                0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
                0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
                0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
                0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
                0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
                0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
                0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
                0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
                0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
                0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
                0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x04970, 0x064b0, 0x162a6, 0x0ea50, 0x06b20,
                0x0aab1, 0x0aa60, 0x0b520, 0x06d26, 0x09570, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50,
                0x06d40, 0x0af46, 0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58,
                0x055c0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0,
                0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0,
                0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6
            ];
            
            const Gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
            const Zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
            const Animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
            const Mon = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
            
            let offset = (Date.UTC(year, month, day) - Date.UTC(1900, 0, 31)) / 86400000;
            
            let i = 1900;
            let temp = 0;
            while (i < 2100 && offset > 0) {
                temp = this.lYear(i, lunarInfo);
                offset -= temp;
                i++;
            }
            if (offset < 0) {
                offset += temp;
                i--;
            }
            
            const leap = this.leapMonth(i, lunarInfo);
            let isLeap = false;
            let j = 1;
            while (j < 13 && offset > 0) {
                if (leap > 0 && j == (leap + 1) && isLeap == false) {
                    --j;
                    isLeap = true;
                    temp = this.leapDays(i, lunarInfo);
                } else {
                    temp = this.monthDays(i, j, lunarInfo);
                }
                
                if (isLeap == true && j == (leap + 1)) {
                    isLeap = false;
                }
                
                offset -= temp;
                j++;
            }
            
            if (offset == 0 && leap > 0 && j == leap + 1) {
                if (isLeap) {
                    isLeap = false;
                } else {
                    isLeap = true;
                    --j;
                }
            }
            
            if (offset < 0) {
                offset += temp;
                --j;
            }
            
            const lunarMonth = j;
            const lunarDay = offset + 1;
            
            const gzYear = Gan[(i - 4) % 10] + Zhi[(i - 4) % 12];
            const animal = Animals[(i - 4) % 12];
            
            let dayStr = '';
            if (lunarDay == 1) {
                dayStr = '初一';
            } else if (lunarDay == 2) {
                dayStr = '初二';
            } else if (lunarDay == 3) {
                dayStr = '初三';
            } else if (lunarDay == 10) {
                dayStr = '初十';
            } else if (lunarDay == 20) {
                dayStr = '二十';
            } else if (lunarDay == 30) {
                dayStr = '三十';
            } else {
                const t1 = ['初', '十', '廿', '三'];
                const t2 = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
                dayStr = t1[Math.floor(lunarDay / 10)] + t2[lunarDay % 10];
            }
            
            return `${gzYear}年${animal}年 ${Mon[lunarMonth - 1]}月${dayStr}`;
        } catch (e) {
            return null;
        }
    }

    lYear(y, lunarInfo) {
        let sum = 348;
        for (let i = 0x8000; i > 0x8; i >>= 1) {
            sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
        }
        return (sum + this.leapDays(y, lunarInfo));
    }

    leapMonth(y, lunarInfo) {
        return (lunarInfo[y - 1900] & 0xf);
    }

    leapDays(y, lunarInfo) {
        if (this.leapMonth(y, lunarInfo)) {
            return ((lunarInfo[y - 1900] & 0x10000) ? 30 : 29);
        }
        return (0);
    }

    monthDays(y, m, lunarInfo) {
        return ((lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29);
    }
}

class UnitConverterSkill {
    constructor() {
        this.name = 'converter';
        this.description = '单位转换（长度、重量、温度等）';
        this.usageCount = 0;
        this.enabled = true;
        
        this.conversions = {
            length: {
                '米': { to: '米', factor: 1 },
                '千米': { to: '米', factor: 1000 },
                '公里': { to: '米', factor: 1000 },
                '厘米': { to: '米', factor: 0.01 },
                '毫米': { to: '米', factor: 0.001 },
                '英尺': { to: '米', factor: 0.3048 },
                '英寸': { to: '米', factor: 0.0254 },
                '英里': { to: '米', factor: 1609.344 },
                '码': { to: '米', factor: 0.9144 }
            },
            weight: {
                '千克': { to: '千克', factor: 1 },
                '公斤': { to: '千克', factor: 1 },
                '克': { to: '千克', factor: 0.001 },
                '吨': { to: '千克', factor: 1000 },
                '磅': { to: '千克', factor: 0.453592 },
                '盎司': { to: '千克', factor: 0.0283495 },
                '斤': { to: '千克', factor: 0.5 },
                '两': { to: '千克', factor: 0.05 }
            },
            volume: {
                '升': { to: '升', factor: 1 },
                '毫升': { to: '升', factor: 0.001 },
                '立方米': { to: '升', factor: 1000 },
                '加仑': { to: '升', factor: 3.78541 },
                '品脱': { to: '升', factor: 0.473176 }
            },
            area: {
                '平方米': { to: '平方米', factor: 1 },
                '平方公里': { to: '平方米', factor: 1000000 },
                '公顷': { to: '平方米', factor: 10000 },
                '亩': { to: '平方米', factor: 666.667 },
                '平方英尺': { to: '平方米', factor: 0.092903 },
                '平方英里': { to: '平方米', factor: 2589988.11 }
            },
            speed: {
                'm/s': { to: 'm/s', factor: 1 },
                'km/h': { to: 'm/s', factor: 0.277778 },
                'mph': { to: 'm/s', factor: 0.44704 },
                '节': { to: 'm/s', factor: 0.514444 }
            }
        };
    }

    execute(context) {
        this.usageCount++;
        
        const parsed = this.parseQuery(context);
        if (!parsed) {
            return { 
                success: false, 
                result: '请提供转换请求，例如："100米转英尺" 或 "5公斤等于多少磅"',
                skill: this.name 
            };
        }
        
        const { value, fromUnit, toUnit } = parsed;
        const result = this.convert(value, fromUnit, toUnit);
        
        if (result === null) {
            return { 
                success: false, 
                result: `不支持 ${fromUnit} 到 ${toUnit} 的转换`,
                skill: this.name 
            };
        }
        
        return { 
            success: true, 
            result: `🔄 单位转换\n\n${value} ${fromUnit} = ${this.formatNumber(result)} ${toUnit}`,
            skill: this.name 
        };
    }

    parseQuery(query) {
        const patterns = [
            /(\d+\.?\d*)\s*(\S+?)\s*(转|换|等于|=|to)\s*(\S+)/,
            /(\d+\.?\d*)\s*(\S+?)\s+等于多少\s*(\S+)/,
            /(\d+\.?\d*)\s*(\S+?)\s+to\s+(\S+)/i
        ];
        
        for (const pattern of patterns) {
            const match = query.match(pattern);
            if (match) {
                const value = parseFloat(match[1]);
                const fromUnit = this.normalizeUnit(match[2]);
                const toUnit = this.normalizeUnit(match[4] || match[3]);
                
                if (fromUnit && toUnit) {
                    return { value, fromUnit, toUnit };
                }
            }
        }
        
        return null;
    }

    normalizeUnit(unit) {
        const aliases = {
            'm': '米', 'meter': '米', 'meters': '米',
            'km': '千米', 'kilometer': '千米', 'kilometers': '千米',
            'cm': '厘米', 'centimeter': '厘米',
            'mm': '毫米', 'millimeter': '毫米',
            'kg': '千克', 'kilogram': '千克', 'kilograms': '千克',
            'g': '克', 'gram': '克', 'grams': '克',
            'lb': '磅', 'pound': '磅', 'pounds': '磅',
            'oz': '盎司', 'ounce': '盎司',
            'l': '升', 'liter': '升', 'liters': '升',
            'ml': '毫升', 'milliliter': '毫升',
            '°c': '摄氏度', 'c': '摄氏度', 'celsius': '摄氏度',
            '°f': '华氏度', 'f': '华氏度', 'fahrenheit': '华氏度',
            'k': '开尔文', 'kelvin': '开尔文',
            'ft': '英尺', 'foot': '英尺', 'feet': '英尺',
            'in': '英寸', 'inch': '英寸', 'inches': '英寸',
            'mi': '英里', 'mile': '英里', 'miles': '英里',
            'yd': '码', 'yard': '码', 'yards': '码',
            'gal': '加仑', 'gallon': '加仑',
            'pt': '品脱', 'pint': '品脱'
        };
        
        const lower = unit.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '');
        return aliases[lower] || unit;
    }

    convert(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;
        
        if ((fromUnit === '摄氏度' || fromUnit === '华氏度' || fromUnit === '开尔文') &&
            (toUnit === '摄氏度' || toUnit === '华氏度' || toUnit === '开尔文')) {
            return this.convertTemperature(value, fromUnit, toUnit);
        }
        
        let fromBase = null;
        let toBase = null;
        let baseUnit = null;
        
        for (const [category, units] of Object.entries(this.conversions)) {
            if (units[fromUnit] && units[toUnit]) {
                fromBase = units[fromUnit];
                toBase = units[toUnit];
                baseUnit = fromBase.to;
                break;
            }
        }
        
        if (!fromBase || !toBase) return null;
        
        const inBase = value * fromBase.factor;
        return inBase / toBase.factor;
    }

    convertTemperature(value, from, to) {
        let celsius;
        
        if (from === '摄氏度') {
            celsius = value;
        } else if (from === '华氏度') {
            celsius = (value - 32) * 5 / 9;
        } else if (from === '开尔文') {
            celsius = value - 273.15;
        }
        
        if (to === '摄氏度') {
            return celsius;
        } else if (to === '华氏度') {
            return celsius * 9 / 5 + 32;
        } else if (to === '开尔文') {
            return celsius + 273.15;
        }
        
        return null;
    }

    formatNumber(num) {
        if (Math.abs(num) < 0.0001 || Math.abs(num) >= 1000000) {
            return num.toExponential(4);
        }
        return parseFloat(num.toFixed(4)).toString();
    }
}

class TextProcessorSkill {
    constructor() {
        this.name = 'text';
        this.description = '文本处理（字数统计、大小写转换等）';
        this.usageCount = 0;
        this.enabled = true;
    }

    execute(context) {
        this.usageCount++;
        
        const stats = this.analyze(context);
        
        let result = `📝 文本分析结果\n\n`;
        result += `📊 总字符数: ${stats.chars}\n`;
        result += `📊 中文字符: ${stats.chineseChars}\n`;
        result += `📊 英文字母: ${stats.englishChars}\n`;
        result += `📊 数字字符: ${stats.digitChars}\n`;
        result += `📊 空格数: ${stats.spaceChars}\n`;
        result += `📊 标点符号: ${stats.punctuationChars}\n`;
        result += `📊 行数: ${stats.lines}\n`;
        result += `📊 段落数: ${stats.paragraphs}\n`;
        result += `📊 句子数: ${stats.sentences}\n`;
        
        if (stats.words > 0) {
            result += `📊 英文单词: ${stats.words}\n`;
        }
        
        if (stats.chineseChars > 0) {
            result += `\n💡 这是一段${stats.chineseChars > stats.englishChars ? '中文' : '中英混合'}文本`;
        }
        
        return { success: true, result, skill: this.name };
    }

    analyze(text) {
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
        const digitChars = (text.match(/\d/g) || []).length;
        const spaceChars = (text.match(/\s/g) || []).length;
        const punctuationChars = (text.match(/[，。！？、；：""''（）【】《》,.!?;:"'()\[\]<>]/g) || []).length;
        
        const lines = text.split('\n').length;
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
        const sentences = (text.match(/[。！？.!?]/g) || []).length || (text.length > 0 ? 1 : 0);
        const words = (text.match(/[a-zA-Z]+/g) || []).length;
        
        return {
            chars: text.length,
            chineseChars,
            englishChars,
            digitChars,
            spaceChars,
            punctuationChars,
            lines,
            paragraphs,
            sentences,
            words
        };
    }
}

class RandomGeneratorSkill {
    constructor() {
        this.name = 'random';
        this.description = '随机数生成、随机选择、密码生成';
        this.usageCount = 0;
        this.enabled = true;
    }

    execute(context) {
        this.usageCount++;
        
        const query = context.toLowerCase();
        
        if (query.includes('密码') || query.includes('password')) {
            const length = this.extractNumber(query, 8, 32, 16);
            const password = this.generatePassword(length);
            return { 
                success: true, 
                result: `🔐 密码生成\n\n生成的密码:\n${password}\n\n长度: ${length} 位`,
                skill: this.name 
            };
        }
        
        if (query.includes('随机数') || query.includes('random number')) {
            const min = this.extractNumber(query, 0, 1000000, 0);
            const max = this.extractNumber(query, 1, 1000000, 100);
            const count = this.extractNumber(query, 1, 100, 1);
            const numbers = [];
            for (let i = 0; i < Math.min(count, 20); i++) {
                numbers.push(this.randomInt(min, max));
            }
            return { 
                success: true, 
                result: `🎲 随机数\n\n范围: ${min} - ${max}\n生成: ${numbers.join(', ')}`,
                skill: this.name 
            };
        }
        
        if (query.includes('选择') || query.includes('pick') || query.includes('choose')) {
            const options = this.extractOptions(context);
            if (options.length > 0) {
                const choice = options[Math.floor(Math.random() * options.length)];
                return { 
                    success: true, 
                    result: `🎯 随机选择\n\n选项: ${options.join(', ')}\n\n✨ 选择结果: ${choice}`,
                    skill: this.name 
                };
            }
        }
        
        if (query.includes('uuid') || query.includes('guid')) {
            const uuid = this.generateUUID();
            return { 
                success: true, 
                result: `🆔 UUID 生成\n\n${uuid}`,
                skill: this.name 
            };
        }
        
        if (query.includes('颜色') || query.includes('color')) {
            const color = this.generateColor();
            return { 
                success: true, 
                result: `🎨 随机颜色\n\nHEX: ${color.hex}\nRGB: ${color.rgb}\nHSL: ${color.hsl}`,
                skill: this.name 
            };
        }
        
        return { 
            success: true, 
            result: `🎲 随机工具\n\n支持的功能:\n• 生成密码: "生成16位密码"\n• 随机数: "1-100随机数"\n• 随机选择: "选择 A、B、C"\n• UUID: "生成uuid"\n• 颜色: "随机颜色"`,
            skill: this.name 
        };
    }

    extractNumber(query, min, max, defaultValue) {
        const match = query.match(/\d+/g);
        if (match && match.length > 0) {
            const num = parseInt(match[0]);
            return Math.max(min, Math.min(max, num));
        }
        return defaultValue;
    }

    extractOptions(query) {
        const separators = /[,，、/\\|]/;
        const cleaned = query.replace(/(随机|选择|pick|choose|from)\s*/gi, '');
        return cleaned.split(separators).map(s => s.trim()).filter(s => s.length > 0);
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generatePassword(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }
        return password;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    generateColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        
        const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        const rgb = `rgb(${r}, ${g}, ${b})`;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2 / 255;
        let h, s;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = (max - min) / 255;
            s = l > 0.5 ? d / (2 - max/255 - min/255) : d / (max/255 + min/255);
            switch (max) {
                case r: h = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / (max - min) + 2) / 6; break;
                case b: h = ((r - g) / (max - min) + 4) / 6; break;
            }
        }
        
        const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
        
        return { hex, rgb, hsl };
    }
}

module.exports = { 
    DateTimeSkill, 
    UnitConverterSkill, 
    TextProcessorSkill, 
    RandomGeneratorSkill 
};
