# 正中教室计算机下载并安装 Python 第三方库指南

### Computer in the ZhengZhong Classroom: Guide to Downloading and Installing Python Third-Party Libraries

## 序言

设想一下：当你身处正中教室，你面前是正中教室的希沃大屏，你试图运行一个 Python 程序，但是解释器显示：$\text{ModuleNotFoundError: No module named 'xxx'}$。

---

## 前言

> $\text{How does the author introduce the topic?}$
>
> $\text{A.By describing an immersive scene.}$
>
> $\text{B.By quoting a remark.}$
>
> $\text{C.By making a comparison.}$
>
> $\text{D.By giving an explanation.}$

## 正文

> $\text{As we all know}\to\text{Awak}\to\text{众所周知}$

$Awak$，河北省石家庄市正定县有高中，名曰河北正定中学。

$Awak$，河北正定中学里面有教室，其教室里面有希沃大屏。

$Awak$，其希沃大屏中有希沃浏览器，希沃浏览器可以打开。

$Awak$，在希沃浏览器中打开一个网址，通常只会无功而返。

### 易知：

- $Maybe\ Awak$，正中网络限制大部分域名的访问。
- $Awak$，钉钉可以正常使用，也就是说没有限制钉钉相关域名的访问。

### 探索：

#### 山重水复疑无路

$One\ day,I\ was\ in\ the\ classroom,$ 尝试 $ing$ 使用希沃浏览器打开钉钉官网。

> $Not\ Awak$，[钉钉](https://www.dingtalk.com/)的官网是：https://www.dingtalk.com/

~~显然。并非显然。~~ 我当时不知道钉钉的官网。

$Therefore,$ 我进行了一些尝试：

> $www.dingding.com$ $ ^{[1,1]}$
> 
> $www.dingding.cn$ $ ^{[1,1]}$
> 
> $www.dingding.com.cn$ $ ^{[1,1]}$
> 
> $www.dingding.net$ $ ^{[1,1]}$

~~并无收获。~~ $\text{Pain But No Gain.}$

#### 柳暗花明又一村

$\huge\text{Awak}$，钉钉是阿里的产品。

$Then,$ 我尝试了[阿里云](https://www.aliyun.com/)的官网（事实上，当时也不知道官网是什么，就尝试了一下）$ ^{[1,1]}$：

> $https://www.aliyun.com/$ $ ^{[1,1]}$

$It\ turned\ out:$

![](https://cdn.luogu.com.cn/upload/image_hosting/wnygwqpn.png)

说明：此图片非当时图片，仅用作演示说明（此为 $\text{Firefox}$ 浏览器）。

$Now,I\ think\ you\ already\ have\ the\ answer\ in\ your\ heart.$（~~机翻~~）

### 方法：

$\text{As Python Developers Know,}$ 我们可以使用 Python 镜像源下载 Python 第三方库，使用内置 pip 包进行下载和安装操作。

> 欢迎使用[CSDN](https://www.csdn.net/)平台：
>
> 请关注创作者：[HAH-HAH（HAH_000000）](https://blog.csdn.net/HAH_000000)
>
> 关于 Python pip 的使用，可以参见博客文章：[【Python 基础】Python pip 使用指南（Windows 版）](https://blog.csdn.net/HAH_000000/article/details/150430096)

因为学校没有限制[阿里云](https://www.aliyun.com/)的域名，所以我们可以使用阿里云的 Python 镜像源：

```text
https://mirrors.aliyun.com/pypi/simple/
```

对于 Python pip 的使用，我们可以设置全局镜像源（在命令提示符中运行以下指令）：

```cmd
pip config set global.index-url [镜像源]
```

或者单次安装使用镜像源：

```cmd
pip install -i [镜像源] [库名]
```

~~其中，本文阅读对象并不应该是从零开始者。~~

## UPDATE

- 2026.04.18 第一版（$author:\text{ZZA000HAH}$，$‌version:1.0.0$，说明：本次时间仓促，后续会对本文进行完善）。
- 2026.04.26 第一版第一次更新（$author:\text{ZZA000HAH}$，$‌version:1.0.1$），更新见 $[v,k],v=1,k=1$。
