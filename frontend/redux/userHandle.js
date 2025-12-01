// userHandle.js
import axios from '../axios';  // apunta a tu axios.js
export const loginUser = (fields, role) => async dispatch => {
  dispatch(authRequest());
  try {
    // antes: /StudentLogin
    const url = role === "Student"
      ? "/student/login"
      : role === "Admin"
        ? "/auth/admin/login"
        : "/teacher/login";
    const { data } = await axios.post(url, fields);
    if (data.role || data.user) {
      // adapta a tu payload: data.user para estudiante
      dispatch(authSuccess(data.role ? data : { ...data.user, role: data.role }));
    } else {
      dispatch(authFailed(data.message));
    }
  } catch (err) {
    dispatch(authError(err.message || "Network Error"));
  }
};
