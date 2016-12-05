<%@ WebHandler Language="C#" Class="Upload" %>

using System;
using System.Web;

public class Upload : IHttpHandler
{

    public void ProcessRequest(HttpContext context)
    {
        string filePath = "data//";

        //write your handler implementation here.
        if (context.Request.Files.Count <= 0)
        {
            context.Response.ContentType = "text/plain";
            context.Response.Write("No file uploaded");
        }
        else
        {
            for (int i = 0; i < context.Request.Files.Count; ++i)
            {
                HttpPostedFile file = context.Request.Files[i];
                file.SaveAs(context.Server.MapPath(filePath + file.FileName));
                context.Response.ContentType = "text/plain";
                context.Response.Write("File uploaded");
            }
        }
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
}