/** Shape of the token payload decoded from the IAM JWT. */
export type TokenPayload = {
  id: string;
  email: string;
  role: string;
  exp: number;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type AuthResponse = {
  data: {
    access: string;
    refresh: string;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
    };
  };
};
