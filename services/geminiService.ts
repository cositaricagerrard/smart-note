
import { GoogleGenAI, Type } from "@google/genai";
import { Note, Task } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeNote = async (content: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `لخص الملاحظة التالية باللغة العربية بأسلوب موجز واحترافي: \n\n${content}`,
  });
  return response.text || "فشل التلخيص";
};

export const extractTasks = async (content: string): Promise<Partial<Task>[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `استخرج المهام (To-do items) من النص التالي وأرجعها بصيغة JSON. النص: \n\n${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'عنوان المهمة' },
            dueDate: { type: Type.STRING, description: 'تاريخ الاستحقاق إن وجد (YYYY-MM-DD)' },
          },
          required: ['title'],
        },
      },
    },
  });
  
  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const suggestCategories = async (title: string, content: string): Promise<{ category: string, tags: string[] }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `بناءً على العنوان والمحتوى، اقترح تصنيفاً واحداً (من: عمل، شخصي، دراسة، أفكار) و 3 وسوم مناسبة باللغة العربية. العنوان: ${title}, المحتوى: ${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['category', 'tags'],
      },
    },
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { category: 'شخصي', tags: [] };
  }
};

export const generateMindMapData = async (notes: Note[]) => {
  const context = notes.map(n => `ID: ${n.id}, Title: ${n.title}`).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `تحليل العلاقات بين الملاحظات التالية وبناء خريطة ذهنية (Mind Map) ترتبها هرمياً. أرجع النتيجة كـ JSON للعقد والروابط (nodes and links). الملاحظات:\n\n${context}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                group: { type: Type.STRING }
              }
            }
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
};

export const performOCR = async (base64Image: string): Promise<string> => {
  const imagePart = {
    inlineData: {
      mimeType: 'image/png',
      data: base64Image.split(',')[1],
    },
  };
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [imagePart, { text: "استخرج النص من هذه الصورة بدقة عالية." }],
    },
  });
  
  return response.text || "";
};
