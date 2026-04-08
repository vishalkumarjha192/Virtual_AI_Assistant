import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await axios.get("/chat");
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, []);

  const loadConversation = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/chat/${id}`);
      setActiveConversation(data);
      setMessages(data.messages);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content) => {
    setSending(true);
    const userMsg = { role: "user", content, _id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const { data } = await axios.post("/chat", {
        message: content,
        conversationId: activeConversation?._id || null,
      });

      const assistantMsg = {
        role: "assistant",
        content: data.message,
        _id: (Date.now() + 1).toString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (!activeConversation) {
        setActiveConversation({ _id: data.conversationId });
        fetchConversations();
      }

      return data;
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== userMsg._id));
      throw err;
    } finally {
      setSending(false);
    }
  }, [activeConversation, fetchConversations]);

  const newConversation = useCallback(() => {
    setActiveConversation(null);
    setMessages([]);
  }, []);

  const deleteConversation = useCallback(async (id) => {
    await axios.delete(`/chat/${id}`);
    if (activeConversation?._id === id) newConversation();
    fetchConversations();
  }, [activeConversation, newConversation, fetchConversations]);

  const clearAll = useCallback(async () => {
    await axios.delete("/chat/all");
    newConversation();
    setConversations([]);
  }, [newConversation]);

  return (
    <ChatContext.Provider value={{
      conversations, activeConversation, messages, loading, sending,
      fetchConversations, loadConversation, sendMessage,
      newConversation, deleteConversation, clearAll,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};
