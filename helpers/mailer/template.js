async function layout(content) {
  const body = `
      <div style="max-width:650px;margin:0 auto;width:100%;
      font-family: lato, 'helvetica neue', helvetica, arial, sans-serif;
      font-size: 14px;
      line-height: 17.5px;
      letter-spacing: -1%;
      color: #1e2120;
      ">
        <div>
          ${content}
        </div>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
        <tr>
          <td style="padding: 20px 0">
              <div style="padding: 0; margin-top: 10px; text-align:center;font-size: 12px">
                  &copy; 2024 <b style="color=#FBD487">ConsTruck</b> <br />
              </div>
          </td>
        </tr>
      </table>
    </div>
`;
  return body;
}

module.exports = {
  layout,
};
