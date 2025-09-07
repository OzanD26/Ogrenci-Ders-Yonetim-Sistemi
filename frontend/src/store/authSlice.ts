import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import client from "../api/client";

export const login = createAsyncThunk("auth/login", async (payload: { email: string; password: string }) => {
  const { data } = await client.post("/auth/login", payload);
  localStorage.setItem("token", data.token);
  return data as { token: string; role: "ADMIN" | "STUDENT" };
});

const slice = createSlice({
  name: "auth",
  initialState: { token: localStorage.getItem("token") as string | null, role: null as null | "ADMIN" | "STUDENT" },
  reducers: {
    logout(state) { state.token = null; state.role = null; localStorage.removeItem("token"); }
  },
  extraReducers(builder) {
    builder.addCase(login.fulfilled, (state, action) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
    });
  }
});
export const { logout } = slice.actions;
export default slice.reducer;
