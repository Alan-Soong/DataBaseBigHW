// pages/api/auth/authenticatedRoute.js
import { parse } from 'cookie';
// 假设 db.js 在 pages/api 目录下，如果不在请调整路径
// import { query } from '../db'; 

export function authenticatedRoute(handler) {
  return async (req, res) => {
    try {
      // 检查cookie中的登录token
      const cookies = parse(req.headers.cookie || '');
      const loginToken = cookies.login_token;

      if (!loginToken || loginToken !== 'valid') {
        // 如果未认证，返回 401 未授权错误 (JSON格式)
        return res.status(401).json({ message: '未登录或会话已过期' });
      }

      // 如果认证成功，继续执行原始的API处理函数
      // 您可以在这里根据token或其他方式获取用户ID或完整用户信息
      // 并将其添加到 req 对象，例如 req.currentUser = { user_id: userId };
      // 这里暂时只做简单的token验证，不获取用户详情

      return handler(req, res); // 调用原始的API处理函数

    } catch (error) {
      console.error('认证中间件发生错误:', error);
      // 返回一个通用的服务器错误，避免暴露内部认证逻辑细节
      return res.status(500).json({ message: '认证过程中发生服务器错误' });
    }
  };
}

// 如果您的认证中间件需要获取用户ID并传递给handler
// 例如：
/*
import { parse } from 'cookie';
import { query } from '../db'; // 假设 db.js 在 pages/api 目录下

export function authenticatedRoute(handler) {
  return async (req, res) => {
    try {
      const cookies = parse(req.headers.cookie || '');
      const loginToken = cookies.login_token;

      if (!loginToken || loginToken !== 'valid') {
        return res.status(401).json({ message: '未登录或会话已过期' });
      }

      // 假设可以通过某种方式从token或req中获取用户ID
      // 这里的实现取决于您如何在登录时生成和存储token以及用户ID的关系
      // 比如，如果您的token就是用户ID（不推荐实际应用中这样做）
      // const currentUserId = loginToken; // 示例：如果token就是用户ID

      // 或者通过查询数据库来验证token并获取用户ID
      // 例如，如果有一个sessions表存储token和user_id的对应关系
      // const [sessions] = await query('SELECT user_id FROM sessions WHERE token = ?', [loginToken]);
      // if (sessions.length === 0) {
      //    return res.status(401).json({ message: '无效的会话 token' });
      // }
      // const currentUserId = sessions[0].user_id;

      // 将用户ID添加到请求对象，以便handler可以使用
      // req.currentUser = { user_id: currentUserId }; // 或者更完整的用户信息

      // 执行原始的API处理函数
      // return handler(req, res, req.currentUser); // 如果handler接收用户参数
      return handler(req, res); // 如果handler从req中获取用户

    } catch (error) {
      console.error('认证中间件发生错误:', error);
      return res.status(500).json({ message: '认证过程中发生服务器错误' });
    }
  };
}
*/