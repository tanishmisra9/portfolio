---
title: "What I Built at Toyota This Summer"
date: "2026-08-07"
description: "An AI pipeline, a small-world moment, and twelve weeks that changed how I think about building software."
---

0 to 60 is always a fun car stat. Mine was 3 hours to 25 seconds.

That's how much faster the AI pipeline I built this summer makes writing a test case. Towards the end, I got to share it with a room of engineers and leadership. I'm grateful for the chance.

![My badge on day one at Toyota's Plano campus](/blog/toyota-reflection/Badge.png)
*My badge on day one at Toyota's Plano campus*

Every in-vehicle infotainment test case at Toyota gets written by hand today. There are thousands of them. Writing them this way is slow and inconsistent enough to block automation at scale.

I created a system that reads a manual test description and generates a clean, ready-to-run script.

A test case is like a recipe. It's a list of steps to check that one specific thing works, like clicking an icon. Some steps repeat across many test cases, so instead of rewriting them, we save them as reusable building blocks.

The model didn't get this right at first. It could skip setup steps, or write out numerous lines by hand when a reusable block already existed. After tightening guardrails, it swung too far, cramming entire test cases into single blocks and losing nuance. Getting that balance right took a lot of tuning. That's kaizen, setting your own bar for good instead of stopping at the first thing that works.

None of that tuning worked without clean data, so I fixed 307 broken test cases, leaving 1,063 usable. From there, automatic checks caught mistakes early, a built-in scoring system graded every change instead of gut feel, and the system could swap model providers as needed.

It's still human-in-the-loop. A person reviews everything before it ships, no matter how fast the model gets there.

During the Q&A after my presentation, **Charan Lota**, CXD's GVP, asked what made my AI experience at Toyota unique. That question stuck with me. This project pulled context from a lot of different sources. The sheer variability in that data made normalizing and validating it the hardest part early on. That's a skill I'll carry with me well beyond this co-op.

![The Automation team, CXD.](/blog/toyota-reflection/Automation-team.jpeg)
*The Automation team, CXD.*

I am incredibly grateful for the support from **Bhavya Pittala**, **Lavanya Adapala**, and **Renu Vijayachandran**.

I owe a huge thank you to **Siddarth Hara Shylander** for getting me up to speed on our automation tools and helping me uncover test suite defects. I'm also grateful to **Ramarao Soodireddy**, whose guidance on making the system region-aware and validating test cases was instrumental.

I also got hands-on with the hardware, replacing older components with newer prototype electronics alongside **Joli Kabamba**. The parts didn't fit neatly, and there was no manual, so **Joli** and I improvised. Genchi genbutsu, in practice: see the actual part instead of guessing from a spec sheet. Toyota calls that Drive Curiosity.

CXD interns also got the chance to drive Toyota's fleet vehicles, including the 2026 bZ which was my favorite.

![Behind the wheel of the bZ.](/blog/toyota-reflection/Driving-bZ.jpeg)
*Behind the wheel of the bZ.*

One moment made the world feel small. **Brooke Jeffcoat**, a cyber risk analyst at Toyota, reached out after her husband, **Jake**, found Candle, a research dashboard I built for the choroideremia community. She told me it was the first time they'd found something that made CHM research easy to understand. It was a rare, organic moment to hear the true impact of my software in making CHM research accessible.

![With Brooke Jeffcoat.](/blog/toyota-reflection/Tanish-and-brooke.jpeg)
*With Brooke Jeffcoat.*

I volunteered through Toyota4Good, building backpacks, and toured the Quality Learning Center. Quality and safety are truly lived-in values here.

![Toyota4Good backpack build.](/blog/toyota-reflection/Toyota4good.JPG)
*Toyota4Good backpack build.*

My manager, **Nick Sasaki**, managed me through all of it and shaped a project scope that actually mattered. He pushed me to automate rather than settle, made time for architecture decisions, and connected me with people across the org, including **Daniel Hanna**, who helped me with early technical decisions and running AI at scale. Both shaped this experience in ways I won't forget.

![With Nick Sasaki, my manager.](/blog/toyota-reflection/Tanish-and-nick.jpeg)
*With Nick Sasaki, my manager.*

A special thanks to **Christopher Ogden** and **Robert Douglas II** for their support throughout the term. Christopher also helped manage my progress in biweekly sprint reviews and shaped how the system flags uncertain outputs for review. **Nick Nitta**, who I met through Toyota's Young Professionals program, brought mentorship and industry perspective all term.

I was glad to spend the term with CXD interns **Ayush Pai**, **Aaron Gheevarghese**, and **Jeremiah Yong**, with **Fanuel Zekiros** and **Dyan Colvin-Hoffmann** keeping the co-op program running smoothly.

![With Fanuel and the CXD interns.](/blog/toyota-reflection/CXD-interns.jpg)
*With Fanuel and the CXD interns.*

Recruitment and onboarding felt smooth thanks to **Samantha Rubick**, **Nikki Hackett**, and **Marisa Romero**.

A shout-out to the Piney Woods baristas, who memorized my iced white mocha order (and slipped me the occasional free cookie).

![Signing the Toyota wheel cap.](/blog/toyota-reflection/Wheelcap-signature.PNG)
*Signing the Toyota wheel cap.*

I like building systems that reach people, and I'm grateful to everyone at Toyota who showed me what that actually takes.